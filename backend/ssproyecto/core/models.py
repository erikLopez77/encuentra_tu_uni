from django.db import models

# Create your models here.
class Universidad(models.Model):
    nombre = models.CharField(max_length=255)
    estado = models.CharField(max_length=100)
    ciudad = models.CharField(max_length=100)
    TIPO_CHOICES = [('PUB', 'Pública'), ('PRI', 'Privada')]
    tipo = models.CharField(max_length=3, choices=TIPO_CHOICES)
    rating_google = models.FloatField(default=0.0)
    sitio_web = models.URLField(blank=True)

    # Campo para guardar el ID de Google y evitar duplicados al importar
    google_place_id = models.CharField(max_length=255, unique=True, null=True)
    class Meta:
        verbose_name_plural = "Universidades"
        # ordena por el ranking de estrellas
        ordering = ['-rating_google']
    def __str__(self):
        return self.nombre

class Perfil(models.Model):
    # perfil vinculado con admim Django
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    # Relación Muchos a Muchos: Un usuario tiene muchas favoritas
    favoritos = models.ManyToManyField('Universidad', related_name='seguidores', blank=True)

    def __str__(self):
        return f"{self.usuario.first_name} {self.usuario.last_name}"