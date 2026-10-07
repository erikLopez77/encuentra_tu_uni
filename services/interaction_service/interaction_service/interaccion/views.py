from rest_framework import generics
from rest_framework.exceptions import ValidationError
from .models import Favorito, Comentario
from .serializers import FavoritoSerializer, ComentarioSerializer

class FavoritoListCreateView(generics.ListCreateAPIView):
    queryset = Favorito.objects.all()
    serializer_class = FavoritoSerializer

    def get_queryset(self):
        # Si envían el usuarioId por query param, podemos filtrar los favoritos de ese usuario
        usuario_id = self.request.query_params.get('usuarioId', None)
        if usuario_id:
            return Favorito.objects.filter(usuarioId=usuario_id)
        return super().get_queryset()

class FavoritoRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    queryset = Favorito.objects.all()
    serializer_class = FavoritoSerializer

class ComentarioListCreateView(generics.ListCreateAPIView):
    serializer_class = ComentarioSerializer

    def get_queryset(self):
        universidad_id = self.kwargs.get('universidad_id')
        return Comentario.objects.filter(universidadId=universidad_id)

    def perform_create(self, serializer):
        universidad_id = self.kwargs.get('universidad_id')
        # Verificar si el usuario ya comentó esta universidad
        usuario_id = self.request.data.get('usuarioId')
        if not usuario_id:
            raise ValidationError({'usuarioId': 'Este campo es requerido.'})
        
        if Comentario.objects.filter(universidadId=universidad_id, usuarioId=usuario_id).exists():
            raise ValidationError({'detail': 'El usuario ya ha comentado esta universidad.'})
            
        serializer.save(universidadId=universidad_id)

class ComentarioRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ComentarioSerializer
    lookup_url_kwarg = 'comentario_id'

    def get_queryset(self):
        universidad_id = self.kwargs.get('universidad_id')
        return Comentario.objects.filter(universidadId=universidad_id)
