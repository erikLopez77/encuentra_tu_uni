from rest_framework import generics, permissions
from .models import Universidad
from .serializers import UniversidadSerializer

class UniversidadListView(generics.ListAPIView):
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        queryset = Universidad.objects.all() # Ya vienen ordenadas por rating por tu Meta
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(ciudad__icontains=estado) 
        return queryset
    
class UniversidadDetailView(generics.RetrieveAPIView):
    queryset = Universidad.objects.all()
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]