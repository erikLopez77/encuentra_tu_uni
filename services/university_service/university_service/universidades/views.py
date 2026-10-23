from rest_framework import generics, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Case, When, Value, IntegerField
from .models import Universidad
from .serializers import UniversidadSerializer


class UniversidadListView(generics.ListAPIView):
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [JWTAuthentication]

    def list(self, request, *args, **kwargs):
        # Al pedir favoritos (?ids=...) devolvemos la lista completa sin paginar,
        # para no truncar la respuesta a PAGE_SIZE (12) elementos.
        if request.query_params.get('ids') is not None:
            self.pagination_class = None
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Universidad.objects.all()
        estado = self.request.query_params.get('estado')
        tipo = self.request.query_params.get('tipo')
        ids = self.request.query_params.get('ids')

        if estado:
            queryset = queryset.filter(ciudad__icontains=estado)
        if tipo and tipo in ('PUB', 'PRI'):
            queryset = queryset.filter(tipo=tipo)

        # ?ids=1,5,12 -> devuelve solo esas universidades (usado por Mis Favoritos).
        # Si no se envía el parámetro, se comporta como un listado normal.
        if ids is not None:
            try:
                pk_list = [int(pk) for pk in ids.split(',') if pk.strip()]
            except ValueError:
                pk_list = []

            if not pk_list:
                # Sin IDs válidos => no devolvemos todas las universidades por accidente
                return queryset.none()

            # Respeta el orden de los IDs recibidos (el orden de favoritos del usuario)
            orden_favoritos = Case(
                *(When(pk=pk, then=Value(idx)) for idx, pk in enumerate(pk_list)),
                output_field=IntegerField(),
            )
            queryset = queryset.filter(pk__in=pk_list).order_by(orden_favoritos)

        return queryset


class UniversidadDetailView(generics.RetrieveAPIView):
    queryset = Universidad.objects.all()
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [JWTAuthentication]