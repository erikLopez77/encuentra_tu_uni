from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Comentario(models.Model):
    universidad = models.ForeignKey(Universidad, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comentarios')
    texto = models.TextField()
    calificacion = models.PositiveSmallIntegerField(default=5)  # 1 a 5 estrellas
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        # Limitar a un comentario por usuario por universidad
        unique_together = [['universidad', 'usuario']]

    def __str__(self):
        return f"Comentario de {self.usuario.first_name} en {self.universidad.nombre}"