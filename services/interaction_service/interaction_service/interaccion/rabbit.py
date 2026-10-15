import json
import os
import threading
import time

import pika

RABBITMQ_URL_DEFAULT = 'amqp://encuentra:encuentra123@localhost:5672/'
COLA = 'comentarios_sincronizacion'
EXCHANGE = 'usuarios'


def _procesar_evento(body):
    """Aplica el evento al modelo de comentarios de ESTE servicio (su propia BD)."""
    from .models import Comentario  # import diferido: evita el AppRegistryNotReady

    evento = json.loads(body)
    if evento.get('evento') == 'usuario.actualizado':
        perfil_id = evento.get('perfil_id')
        nombre = f"{evento.get('nombre') or ''} {evento.get('apellidos') or ''}".strip()
        if perfil_id and nombre:
            actualizados = Comentario.objects.filter(usuarioId=perfil_id).update(autorNombre=nombre)
            print(f'[RabbitMQ] comentarios actualizados para usuario #{perfil_id}: {actualizados}')


def _consumir():
    url = os.environ.get('RABBITMQ_URL', RABBITMQ_URL_DEFAULT)
    while True:
        try:
            connection = pika.BlockingConnection(pika.URLParameters(url))
            channel = connection.channel()

            # Debe coincidir con lo que declara el auth_service (publisher)
            channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)
            channel.queue_declare(queue=COLA, durable=True)
            channel.queue_bind(queue=COLA, exchange=EXCHANGE, routing_key='usuario.actualizado')
            channel.basic_qos(prefetch_count=10)

            def callback(ch, method, properties, body):
                try:
                    _procesar_evento(body)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    # Evento malformado o error de BD: se descarta (requeue=False)
                    # para no provocar un bucle infinito de reintentos
                    print(f'[RabbitMQ] Error procesando evento: {e}')
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

            channel.basic_consume(queue=COLA, on_message_callback=callback)
            print(f'[RabbitMQ] Escuchando eventos en la cola "{COLA}"...')
            channel.start_consuming()
        except Exception as e:
            # Broker caído o aún arrancando: reintenta en 5 segundos
            print(f'[RabbitMQ] Sin conexión ({e}); reintentando en 5s...')
            time.sleep(5)


def iniciar_consumer():
    """Arranca el listener en un hilo daemon (no bloquea el arranque de Django)."""
    threading.Thread(target=_consumir, daemon=True).start()
