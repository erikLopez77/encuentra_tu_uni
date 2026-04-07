from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class Universidad(models.Model):
    nombre = models.CharField(max_length=255)
    estado = models.CharField(max_length=100)
    ciudad = models.CharField(max_length=100)
    TIPO_CHOICES = [('PUB', 'Pública'), ('PRI', 'Privada')]
    tipo = models.CharField(max_length=3, choices=TIPO_CHOICES)
    rating_google = models.FloatField(default=0.0)
    # URL de Google Maps (Donde se encuentra)
    google_maps_url = models.URLField(blank=True, null=True) 
    # Datos nuevos que traeremos con Place Details
    sitio_oficial = models.URLField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    descripcion_ia=models.TextField(blank=True, null=True)
    foto_reference=models.CharField(max_length=500, blank=True, null=True) # URL o referencia a la foto en Google Places
    # Campo para guardar el ID de Google y evitar duplicados al importar
    google_place_id = models.CharField(max_length=255, unique=True, null=True)
    class Meta:
        verbose_name_plural = "Universidades"
        # ordena por el ranking de estrellas
        ordering = ['-rating_google', 'nombre'] # evitar empates
    def __str__(self):
        return self.nombre

class Perfil(models.Model):
    # perfil vinculado con admim Django
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    # Relación Muchos a Muchos: Un usuario tiene muchas favoritas
    favoritos = models.ManyToManyField('Universidad', related_name='seguidores', blank=True)

    def __str__(self):
        return f"{self.usuario.first_name} {self.usuario.last_name}"