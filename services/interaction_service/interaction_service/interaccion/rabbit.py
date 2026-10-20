import json
import os
import threading
import time

import pika

RABBITMQ_URL_DEFAULT = 'amqp://encuentra:encuentra123@localhost:5672/'
COLA = 'comentarios_sincronizacion'
EXCHANGE = 'usuarios'

#consumer de eventos de RabbitMQ para sincronizar los nombres de usuario en los comentarios
def _procesar_evento(body, routing_key=None):
    """Aplica el evento al modelo de comentarios de ESTE servicio (su propia BD)."""
    from django.db import connection, close_old_connections
    from .models import Comentario  # import diferido: evita el AppRegistryNotReady

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
                print(f'[RabbitMQ] comentarios actualizados para usuario (perfil={perfil_id}, user={user_id}): {actualizados} fila(s) -> "{nombre}"')
    finally:
        connection.close()


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
                    _procesar_evento(body, routing_key=method.routing_key)
                    #si la actualizacion es exitosa, le avisamos a Rabbit para eliminar el mensaje de la cola
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    # Evento malformado o error de BD: se descarta (requeue=False)
                    # para no provocar un bucle infinito de reintentos
                    print(f'[RabbitMQ] Error procesando evento: {e}')
                    #si la actualizacion falla, le avisamos a Rabbit para eliminar el mensaje de la cola y no volver a procesarlo 
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
