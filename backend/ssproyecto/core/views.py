from rest_framework import generics, permissions
from .models import Universidad
from .serializers import UniversidadSerializer

class UniversidadListView(generics.ListAPIView):
    queryset = Universidad.objects.all() # Ya vienen ordenadas por rating por tu Meta
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        queryset = Universidad.objects.all()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado__icontains=estado)
        limit = self.request.query_params.get('limit')
        if limit:
            queryset = queryset[:int(limit)]
        else:
            queryset = queryset[:20] # Por defecto mostramos 20 para no saturar
        return queryset
    
class UniversidadDetailView(generics.RetrieveAPIView):
    queryset = Universidad.objects.all()
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]