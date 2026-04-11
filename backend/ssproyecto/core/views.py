from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from django.core.cache import cache
from .models import Universidad, Perfil
from .serializers import UniversidadSerializer, PerfilSerializer, RegisterSerializer
from django.contrib.auth.models import User

class UniversidadListView(generics.ListAPIView):
    serializer_class = UniversidadSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        queryset = Universidad.objects.all()  # Ordenadas por rating via Meta
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

class PerfilCreateDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SessionAuthentication] # Asegura que use sesiones

    def get_object(self):
        # Si llegamos aquí, IsAuthenticated ya pasó, así que user es válido
        user = self.request.user
        cache_key = f"perfil_user_{user.id}"
        
        # Intentamos obtener de caché
        perfil = cache.get(cache_key)
        
        if not perfil:
            # Si no hay caché, obtenemos o creamos
            perfil, created = Perfil.objects.get_or_create(usuario=user)
            try:
                cache.set(cache_key, perfil, timeout=3600)
            except Exception as e:
                print(f"Redis no disponible: {e}")
        
        return perfil
    
    def update(self, request, *args, **kwargs):
        # Permite actualizar solo los campos favoritos
        perfil = self.get_object()
        user=self.request.user
        data=request.data

        if 'first_name' in data:
            nombre = data.get('first_name').strip()
            if not nombre.isalpha(): # Solo letras
                return Response({"error": "El nombre solo puede contener letras."}, status=400)
            user.first_name = nombre
            user.save()
        if 'last_name' in data:
            last_name=data.get('last_name').strip()
            if not last_name.isalpha(): # Solo letras
                return Response({"error": "Los apellidos solo pueden contener letras."}, status=400)
            user.last_name = last_name
            user.save()
        if 'password' in data:
            password = data.get('password')
            if len(password) < 8 or password.isdigit():
                return Response({
                    "error": "La contraseña debe tener al menos 8 caracteres y no puede ser solo números."
                }, status=400)
            user.set_password(password)
            user.save()
        favoritos_ids =data.get('favoritos')
        if favoritos_ids is not None:
            if not isinstance(favoritos_ids, list):
                return Response({"error": "Favoritos debe ser una lista de IDs."}, status=400)
            perfil.favoritos.set(favoritos_ids)
        #al actualizar, borramos el caché para que la proxima, se recargue 
        cache.delete(f"perfil_user_{user.id}") 

        perfil.save()
        serializer=self.get_serializer(perfil)
        return Response(serializer.data)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    # MUY IMPORTANTE: Permitir el acceso a todos para que puedan registrarse
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        # Este método ya viene integrado en CreateAPIView, 
        # pero DRF se encarga de ejecutar .is_valid() automáticamente.
        return super().post(request, *args, **kwargs)