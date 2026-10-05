# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions
# pyrefly: ignore [missing-import]
from rest_framework.authentication import SessionAuthentication
from .models import Universidad, Comentario
from .serializers import ComentarioSerializer

class ComentarioListCreateView(generics.ListCreateAPIView):
    serializer_class = ComentarioSerializer
    authentication_classes = [SessionAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        universidad_id = self.kwargs['universidad_id']
        return Comentario.objects.filter(universidad_id=universidad_id).select_related('usuario')

    def perform_create(self, serializer):
        universidad_id = self.kwargs['universidad_id']
        try:
            universidad = Universidad.objects.get(pk=universidad_id)
        except Universidad.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Universidad no encontrada.")
        # Si el usuario ya comentó, actualiza en lugar de duplicar
        comentario_existente = Comentario.objects.filter(
            universidad=universidad,
            usuario=self.request.user
        ).first()
        if comentario_existente:
            comentario_existente.texto = serializer.validated_data['texto']
            comentario_existente.calificacion = serializer.validated_data.get('calificacion', comentario_existente.calificacion)
            comentario_existente.save()
        else:
            serializer.save(usuario=self.request.user, universidad=universidad)
