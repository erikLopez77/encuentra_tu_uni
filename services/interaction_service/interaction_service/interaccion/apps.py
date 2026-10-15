import os

from django.apps import AppConfig


class InteraccionConfig(AppConfig):
    name = 'interaccion'

    def ready(self):
        # Arranca el consumer de RabbitMQ solo en el proceso real de runserver.
        # RUN_MAIN='true' solo existe en el hijo del autoreloader, así que evitamos
        # arrancarlo dos veces; en migrate/makemigrations tampoco hace falta.
        if os.environ.get('RUN_MAIN') != 'true':
            return
        from . import rabbit
        rabbit.iniciar_consumer()
