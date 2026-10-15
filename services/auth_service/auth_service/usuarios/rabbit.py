import json
import os

import pika


def publicar_evento(routing_key, payload):
    """
    Publica un evento JSON en el exchange 'usuarios' de RabbitMQ.

    Diseñado para no romper la API: si el broker no está disponible,
    solo imprime el error y la petición continúa su curso normal.
    """
    url = os.environ.get('RABBITMQ_URL', 'amqp://encuentra:encuentra123@localhost:5672/')
    try:
        connection = pika.BlockingConnection(pika.URLParameters(url))
        channel = connection.channel()
        # Exchange durable: los eventos no se pierden si el broker se reinicia
        # (el consumer lo declara exactamente igual)
        channel.exchange_declare(exchange='usuarios', exchange_type='topic', durable=True)
        channel.basic_publish(
            exchange='usuarios',
            routing_key=routing_key,
            body=json.dumps(payload, ensure_ascii=False),
            properties=pika.BasicProperties(
                delivery_mode=2,               # mensaje persistente en disco
                content_type='application/json',
            ),
        )
        connection.close()
        print(f'[RabbitMQ] Evento publicado: {routing_key} -> {payload}')
    except Exception as e:
        print(f'[RabbitMQ] No se pudo publicar {routing_key}: {e}')
