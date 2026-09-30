from rest_framework import generics, permissions
from .models import Universidad
from .serializers import UniversidadSerializer


class UniversidadListView(generics.ListAPIView):
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Universidad.objects.all()
        estado = self.request.query_params.get('estado')
        tipo = self.request.query_params.get('tipo')

        if estado:
            queryset = queryset.filter(ciudad__icontains=estado)
        if tipo and tipo in ('PUB', 'PRI'):
            queryset = queryset.filter(tipo=tipo)

        return queryset


class UniversidadDetailView(generics.RetrieveAPIView):
    queryset = Universidad.objects.all()
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]