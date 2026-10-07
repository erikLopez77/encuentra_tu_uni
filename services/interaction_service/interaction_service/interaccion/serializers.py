from rest_framework import serializers
from .models import Comentario, Favorito

class ComentarioSerializer(serializers.ModelSerializer):
    autor_id = serializers.IntegerField(source='usuarioId', read_only=True)
    autor_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comentario
        fields = '__all__'
        extra_kwargs = {
            'universidadId': {'required': False},
            'usuarioId': {'required': False},
        }

    def get_autor_nombre(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.id == obj.usuarioId:
                nombre = f"{request.user.first_name} {request.user.last_name}".strip()
                return nombre or request.user.username
        return f"Usuario #{obj.usuarioId}"


class FavoritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorito
        fields = '__all__'
        extra_kwargs = {
            'usuarioId': {'required': False},
        }
