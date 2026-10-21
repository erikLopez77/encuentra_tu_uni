from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Perfil(models.Model):
    # perfil vinculado con admim Django
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.usuario.first_name} {self.usuario.last_name}"


class OutboxEvento(models.Model):
    """
    Tabla de salida (Outbox) para el patrón Outbox Pattern con RabbitMQ.

    El flujo es:
      1. La vista guarda el evento aquí (misma transacción que el cambio de datos).
      2. El worker de rabbit.py lee los registros con enviado=False y los publica en RabbitMQ.
      3. Si la publicación tiene éxito, marca enviado=True.
      4. Si falla, incrementa `intentos` y guarda el error para diagnóstico.

    Esto garantiza que ningún evento se pierde aunque RabbitMQ esté caído en el momento
    en que ocurre la actualización del perfil.
    """
    routing_key = models.CharField(max_length=100)
    payload = models.JSONField()
    creado_en = models.DateTimeField(auto_now_add=True)
    enviado = models.BooleanField(default=False, db_index=True)
    enviado_en = models.DateTimeField(null=True, blank=True)
    intentos = models.PositiveSmallIntegerField(default=0)
    ultimo_error = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['creado_en']
        verbose_name = 'Evento Outbox'
        verbose_name_plural = 'Eventos Outbox'

    def __str__(self):
        estado = '✓' if self.enviado else f'pendiente ({self.intentos} intentos)'
        return f"[{self.routing_key}] {estado} — {self.creado_en:%Y-%m-%d %H:%M:%S}"
