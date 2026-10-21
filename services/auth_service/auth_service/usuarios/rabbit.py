"""
rabbit.py — auth_service

Implementa el patrón Outbox para publicar eventos en RabbitMQ de forma fiable:

  1. encolar_evento_outbox()   → guarda el evento en la BD (OutboxEvento).
                                 Se llama dentro de transaction.atomic() en la vista,
                                 así el evento nunca se pierde aunque RabbitMQ esté caído.

  2. _publicar_pendientes()    → lee los OutboxEvento(enviado=False) y los publica en
                                 RabbitMQ. Si la publicación tiene éxito, marca enviado=True.
                                 Si falla, incrementa el contador de intentos y guarda el error.

  3. iniciar_worker_outbox()   → arranca un hilo daemon que llama a _publicar_pendientes()
                                 cada POLL_INTERVAL segundos.
"""

import json
import logging
import os
import threading
import time

import pika
from django.utils import timezone

logger = logging.getLogger(__name__)

RABBITMQ_URL_DEFAULT = 'amqp://encuentra:encuentra123@localhost:5672/'
EXCHANGE = 'usuarios'
POLL_INTERVAL = 5       # segundos entre cada barrido del outbox
MAX_INTENTOS = 10       # después de este número de intentos fallidos, se deja de reintentar


# ---------------------------------------------------------------------------
# Paso 1 — Guardar el evento en el Outbox (llamado desde la vista)
# ---------------------------------------------------------------------------

def encolar_evento_outbox(routing_key: str, payload: dict) -> None:
    """
    Inserta un OutboxEvento pendiente en la BD.

    Debe llamarse dentro de una transaction.atomic() junto con el save() del modelo
    de negocio, de forma que ambas operaciones sean atómicas: o se guardan las dos
    o no se guarda ninguna.
    """
    from .models import OutboxEvento  # import diferido: evita AppRegistryNotReady
    OutboxEvento.objects.create(routing_key=routing_key, payload=payload)
    logger.info(
        "Evento encolado en Outbox | routing_key=%s | payload=%s",
        routing_key, payload,
    )


# ---------------------------------------------------------------------------
# Paso 2 — Publicar pendientes en RabbitMQ (llamado por el worker)
# ---------------------------------------------------------------------------

def _publicar_pendientes() -> None:
    """
    Lee todos los OutboxEvento(enviado=False, intentos__lt=MAX_INTENTOS),
    los publica en RabbitMQ y actualiza su estado.

    Si no hay eventos pendientes, no abre conexión con RabbitMQ.
    """
    from django.db import close_old_connections
    from .models import OutboxEvento

    close_old_connections()

    pendientes = list(
        OutboxEvento.objects.filter(enviado=False, intentos__lt=MAX_INTENTOS)
    )
    if not pendientes:
        return

    url = os.environ.get('RABBITMQ_URL', RABBITMQ_URL_DEFAULT)
    connection = None
    try:
        params = pika.URLParameters(url)
        params.socket_timeout = 5
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)

        for evento in pendientes:
            try:
                channel.basic_publish(
                    exchange=EXCHANGE,
                    routing_key=evento.routing_key,
                    body=json.dumps(evento.payload, ensure_ascii=False),
                    properties=pika.BasicProperties(
                        delivery_mode=2,               # persistente en disco
                        content_type='application/json',
                    ),
                )
                evento.enviado = True
                evento.enviado_en = timezone.now()
                evento.ultimo_error = ''
                evento.save(update_fields=['enviado', 'enviado_en', 'ultimo_error'])
                logger.info(
                    "Evento publicado desde Outbox | id=%s | routing_key=%s",
                    evento.id, evento.routing_key,
                )
            except Exception as pub_err:
                evento.intentos += 1
                evento.ultimo_error = str(pub_err)
                evento.save(update_fields=['intentos', 'ultimo_error'])
                logger.warning(
                    "Fallo al publicar evento de Outbox | id=%s | intento=%s | error=%s",
                    evento.id, evento.intentos, pub_err,
                )

    except Exception as conn_err:
        # RabbitMQ no disponible: los eventos siguen en Outbox y se reintentarán
        logger.warning(
            "No se pudo conectar a RabbitMQ para vaciar el Outbox | error=%s", conn_err
        )
        # Incrementar intentos de todos los pendientes de esta ronda
        for evento in pendientes:
            if not evento.enviado:
                evento.intentos += 1
                evento.ultimo_error = str(conn_err)
                evento.save(update_fields=['intentos', 'ultimo_error'])
    finally:
        if connection and not connection.is_closed:
            try:
                connection.close()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Paso 3 — Worker daemon (hilo en segundo plano)
# ---------------------------------------------------------------------------

def _worker_loop() -> None:
    """Bucle infinito que vacía el Outbox cada POLL_INTERVAL segundos."""
    logger.info("Worker Outbox iniciado — intervalo=%ss, max_intentos=%s", POLL_INTERVAL, MAX_INTENTOS)
    while True:
        try:
            _publicar_pendientes()
        except Exception as e:
            logger.error("Error inesperado en worker Outbox: %s", e, exc_info=True)
        time.sleep(POLL_INTERVAL)


def iniciar_worker_outbox() -> None:
    """Arranca el worker del Outbox en un hilo daemon (no bloquea el arranque de Django)."""
    t = threading.Thread(target=_worker_loop, daemon=True, name="outbox-worker")
    t.start()
    logger.info("Hilo del worker Outbox arrancado | thread=%s", t.name)
