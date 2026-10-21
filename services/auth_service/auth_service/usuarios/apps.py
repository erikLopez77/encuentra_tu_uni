import os

from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    name = 'usuarios'

    def ready(self):
        # Arranca el worker del Outbox solo en el proceso real de runserver.
        # RUN_MAIN='true' solo existe en el hijo del autoreloader, así que evitamos
        # arrancar el hilo dos veces; en migrate/makemigrations tampoco hace falta.
        if os.environ.get('RUN_MAIN') != 'true':
            return
        from . import rabbit
        rabbit.iniciar_worker_outbox()
