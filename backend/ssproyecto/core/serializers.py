from rest_framework import serializers
from .models import Universidad, Perfil, Comentario
from django.contrib.auth.models import User
from django.core import validators
import re

import unicodedata

# ── Filtro de contenido inapropiado ──────────────────────────────────────────
# Se normalizan las palabras (sin acentos, minúsculas) para detectar variaciones.
_PALABRAS_PROHIBIDAS = {
    # Insultos directos
    'pendejo','pendeja','pendejos','pendejas','pendejada','pendejadas',
    'cabron','cabrona','cabrones','cabronas',
    'puto','puta','putos','putas','putada','putazo','putazos',
    'chinga','chingada','chingado','chingadera','chingaderas','chingon','chingona',
    'pinche','pinches',
    'culero','culera','culeros','culeras','culo','culos',
    'mamon','mamona','mamones','mamonadas',
    'joto','jota','jotos',
    'verga','vergon','vergona','vergazo',
    'coño','cono',
    'mierda','mierdas',
    'idiota','idiotas',
    'imbecil','imbeciles',
    'estupido','estupida','estupidos','estupidas',
    'ojete','ojetes',
    'zorra','zorras',
    'maricon','maricona','maricones','marica',
    'perra','perras',  # usado como insulto
    'bastardo','bastarda','bastardos','bastardas',
    'gilipollas',
    'hdp','hjdp','hdp',
    'malparido','malparida',
    'mugroso','mugrosa','mugrosos','mugrosas',
    'naco','naca',  # cuando se usa de insulto
    'mayate','mayates',
    'putear','puteo',
    'weon','wea',
    'huevon','huevona',
    'maldito','maldita','malditos','malditas',
}

def _normalizar(texto: str) -> str:
    """Quita acentos y pasa a minúsculas para comparaciones robustas."""
    nfkd = unicodedata.normalize('NFKD', texto.lower())
    return ''.join(c for c in nfkd if not unicodedata.combining(c))

def contiene_palabras_prohibidas(texto: str):
    """
    Devuelve la primera palabra prohibida encontrada, o None si el texto es limpio.
    Busca como palabras completas usando regex para evitar falsos positivos
    (ej: 'culero' no debería bloquear una palabra que lo contenga accidentalmente).
    """
    texto_norm = _normalizar(texto)
    for palabra in _PALABRAS_PROHIBIDAS:
        # \b garantiza que sea palabra completa, no substring de otra
        patron = r'\b' + re.escape(palabra) + r'\b'
        if re.search(patron, texto_norm):
            return palabra
    return None

# ─────────────────────────────────────────────────────────────────────────────

class ComentarioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    autor_id = serializers.IntegerField(source='usuario.id', read_only=True)

    class Meta:
        model = Comentario
        fields = ['id', 'texto', 'calificacion', 'fecha', 'autor_nombre', 'autor_id']
        read_only_fields = ['id', 'fecha', 'autor_nombre', 'autor_id']

    def get_autor_nombre(self, obj):
        nombre = obj.usuario.first_name or obj.usuario.username
        return nombre

    def validate_texto(self, value):
        if not value.strip():
            raise serializers.ValidationError("El comentario no puede estar vacío.")
        palabra = contiene_palabras_prohibidas(value)
        if palabra:
            raise serializers.ValidationError(
                "Tu comentario contiene lenguaje inapropiado. "
                "Por favor mantén un tono respetuoso."
            )
        return value

    def validate_calificacion(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("La calificación debe ser entre 1 y 5.")
        return value

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