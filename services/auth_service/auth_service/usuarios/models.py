from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Perfil(models.Model):
    # perfil vinculado con admim Django
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.usuario.first_name} {self.usuario.last_name}"
