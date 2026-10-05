from django.db import models
# Create your models here.

class Comentario(models.Model):
    universidadId = models.IntegerField()
    usuarioId = models.IntegerField()
    texto = models.TextField()
    calificacion = models.PositiveSmallIntegerField(default=5)  # 1 a 5 estrellas
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

class Favorito(models.Model):
    universidadId = models.IntegerField()
    usuarioId = models.IntegerField()


