from rest_framework import serializers
from .models import Universidad, Perfil
from django.contrib.auth.models import User
from django.core import validators
import re

class UniversidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Universidad
        fields = "__all__"

class PerfilSerializer(serializers.ModelSerializer):
    #permite ver los nombres de las unis favoritas, no solo los IDs
    favoritos_detalles = UniversidadSerializer(many=True, read_only=True, source='favoritos')
    nombre = serializers.CharField(source='usuario.first_name', read_only=True)
    apellidos = serializers.CharField(source='usuario.last_name', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)
    class Meta:
        model = Perfil
        fields = ['id', 'nombre', 'apellidos', 'email', 'favoritos', 'favoritos_detalles']
        read_only_fields = ['usuario']

class RegisterSerializer(serializers.ModelSerializer):
    # Definimos el campo de password explícitamente para validarlo
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def validate_first_name(self, value):
        # Desinfección: Quitamos espacios extra y validamos que sean solo letras
        nombre = value.strip()
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', nombre):
            raise serializers.ValidationError("El nombre solo puede contener letras.")
        return nombre

    def validate_email(self, value):
        # Validación: Comprobar si el correo ya existe
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value

    def validate_password(self, value):
        # Seguridad: Forzar longitud y evitar que sea solo números
        if len(value) < 8:
            raise serializers.ValidationError("La contraseña debe tener al menos 8 caracteres.")
        if value.isdigit():
            raise serializers.ValidationError("La contraseña no puede ser solo números.")
        return value

    def create(self, validated_data):
        # Usamos create_user para que Django encripte la contraseña (hashing)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user