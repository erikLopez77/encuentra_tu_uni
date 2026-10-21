"""
rabbit.py — interaction_service

Consumer de RabbitMQ que sincroniza los nombres de usuario en los comentarios.

Novedades respecto a la versión anterior:
  - Dead Letter Queue (DLQ): los mensajes que fallan (nack) van automáticamente
    a la cola 'comentarios_sincronizacion.dlq' en lugar de desaparecer.
    Puedes inspeccionar esa cola desde el panel de RabbitMQ (http://localhost:15672).
  - Logging estructurado: todos los print() reemplazados por logger con nivel y timestamp.
"""

import json
import logging
import os
import threading
import time

import pika

logger = logging.getLogger(__name__)

RABBITMQ_URL_DEFAULT = 'amqp://encuentra:encuentra123@localhost:5672/'
EXCHANGE = 'usuarios'
COLA = 'comentarios_sincronizacion'

# Dead Letter Exchange / Queue
DLX_EXCHANGE = 'usuarios.dlx'          # exchange que recibe mensajes muertos
DLQ_COLA = 'comentarios_sincronizacion.dlq'  # cola donde se almacenan


# ---------------------------------------------------------------------------
# Lógica de negocio — procesar un evento recibido
# ---------------------------------------------------------------------------

def _procesar_evento(body: bytes, routing_key: str | None = None) -> None:
    """Aplica el evento al modelo Comentario de ESTE servicio (su propia BD)."""
    from django.db import connection, close_old_connections
    from .models import Comentario  # import diferido: evita AppRegistryNotReady

    close_old_connections()
    try:
        evento = json.loads(body)
        tipo = evento.get('evento') or routing_key

        if tipo == 'usuario.actualizado':
            perfil_id = evento.get('perfil_id')
            user_id = evento.get('user_id')
            nombre = f"{evento.get('nombre') or ''} {evento.get('apellidos') or ''}".strip()

            ids = [i for i in [perfil_id, user_id] if i is not None]
            if ids and nombre:
                actualizados = Comentario.objects.filter(usuarioId__in=ids).update(autorNombre=nombre)
                logger.info(
                    "Comentarios actualizados | perfil_id=%s | user_id=%s | nombre='%s' | filas=%s",
                    perfil_id, user_id, nombre, actualizados,
                )
            else:
                logger.warning(
                    "Evento usuario.actualizado incompleto: ids=%s, nombre='%s'", ids, nombre
                )
        else:
            logger.warning("Tipo de evento desconocido recibido: tipo=%s", tipo)
    finally:
        connection.close()


# ---------------------------------------------------------------------------
# Consumer principal con DLQ configurada
# ---------------------------------------------------------------------------

def _consumir() -> None:
    url = os.environ.get('RABBITMQ_URL', RABBITMQ_URL_DEFAULT)
    while True:
        try:
            conn = pika.BlockingConnection(pika.URLParameters(url))
            channel = conn.channel()

            # 1. Declarar el Dead Letter Exchange (DLX)
            #    Todos los mensajes nacked (requeue=False) llegarán aquí.
            channel.exchange_declare(
                exchange=DLX_EXCHANGE,
                exchange_type='fanout',
                durable=True,
            )

            # 2. Declarar la Dead Letter Queue y enlazarla al DLX
            channel.queue_declare(queue=DLQ_COLA, durable=True)
            channel.queue_bind(queue=DLQ_COLA, exchange=DLX_EXCHANGE, routing_key='#')

            # 3. Declarar el exchange principal
            channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)

            # 4. Declarar la cola principal con argumento x-dead-letter-exchange
            #    Cuando un mensaje sea nacked con requeue=False, RabbitMQ lo enrutará
            #    automáticamente al DLX_EXCHANGE → DLQ_COLA.
            channel.queue_declare(
                queue=COLA,
                durable=True,
                arguments={
                    'x-dead-letter-exchange': DLX_EXCHANGE,
                },
            )
            channel.queue_bind(
                queue=COLA,
                exchange=EXCHANGE,
                routing_key='usuario.actualizado',
            )
            channel.basic_qos(prefetch_count=10)

            def callback(ch, method, properties, body):
                try:
                    _procesar_evento(body, routing_key=method.routing_key)
                    # Éxito: le avisamos a RabbitMQ para eliminar el mensaje de la cola
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    # Fallo: enviamos a la DLQ en lugar de reintentar en bucle.
                    # El mensaje queda en 'comentarios_sincronizacion.dlq' para inspección.
                    logger.error(
                        "Error procesando evento | routing_key=%s | error=%s | "
                        "El mensaje se mueve a la DLQ '%s'",
                        method.routing_key, e, DLQ_COLA, exc_info=True,
                    )
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

            channel.basic_consume(queue=COLA, on_message_callback=callback)
            logger.info(
                "Consumer RabbitMQ iniciado | cola='%s' | DLQ='%s'", COLA, DLQ_COLA
            )
            channel.start_consuming()

        except Exception as e:
            # Broker caído o aún arrancando: reintenta en 5 segundos
            logger.warning("Sin conexión a RabbitMQ (%s); reintentando en 5s...", e)
            time.sleep(5)


# ---------------------------------------------------------------------------
# Arranque del hilo daemon
# ---------------------------------------------------------------------------

def iniciar_consumer() -> None:
    """Arranca el listener en un hilo daemon (no bloquea el arranque de Django)."""
    t = threading.Thread(target=_consumir, daemon=True, name="rabbitmq-consumer")
    t.start()
    logger.info("Hilo del consumer RabbitMQ arrancado | thread=%s", t.name)
