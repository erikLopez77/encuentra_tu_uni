from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from rest_framework.views import APIView
from django.core.cache import cache
from django.contrib.auth import update_session_auth_hash, logout
from .models import Universidad, Perfil, Comentario
from .serializers import UniversidadSerializer, PerfilSerializer, RegisterSerializer, ComentarioSerializer
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
        perfil = self.get_object()
        user = self.request.user
        data = request.data
        user_changed = False # Bandera para guardar una sola vez

        if 'first_name' in data:
            nombre = data.get('first_name').strip()
            if not nombre.replace(" ", "").isalpha():
                return Response({"error": "El nombre solo puede contener letras."}, status=status.HTTP_400_BAD_REQUEST)
            user.first_name = nombre
            user_changed = True

        if 'last_name' in data:
            apellido = data.get('last_name').strip()
            if not apellido.replace(" ", "").isalpha():
                return Response({"error": "Los apellidos solo pueden contener letras."}, status=status.HTTP_400_BAD_REQUEST)
            user.last_name = apellido
            user_changed = True

        if 'password' in data:
            password = data.get('password')
            if len(password) < 8 or password.isdigit():
                return Response({
                    "error": "La contraseña debe tener al menos 8 caracteres y no puede ser solo números."
                }, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user_changed = True
        
        # Guardamos los cambios del usuario si hubo alguno
        if user_changed:
            user.save()
            # Solo si se cambió la contraseña, actualizamos el hash de sesión
            if 'password' in data:
                update_session_auth_hash(request, user)

        # Lógica de favoritos
        favoritos_ids = data.get('favoritos')
        if favoritos_ids is not None:
            if not isinstance(favoritos_ids, list):
                return Response({"error": "Favoritos debe ser una lista de IDs."}, status=status.HTTP_400_BAD_REQUEST)
            perfil.favoritos.set(favoritos_ids)

        # Limpiar caché y guardar perfil
        cache.delete(f"perfil_user_{user.id}") 
        perfil.save()
        
        serializer = self.get_serializer(perfil)
        return Response(serializer.data)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    # MUY IMPORTANTE: Permitir el acceso a todos para que puedan registrarse
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        email_nuevo = request.data.get('email')
        if User.objects.filter(email=email_nuevo).exists():
            return Response({"error": "Este correo ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)
        # Este método ya viene integrado en CreateAPIView, 
        # pero DRF se encarga de ejecutar .is_valid() automáticamente.
        return super().post(request, *args, **kwargs)
# ... (tus otros imports y vistas)

class PasswordResetUpdateView(generics.GenericAPIView):
    # Esto permite que cualquier persona (incluso sin loguearse) intente recuperar su cuenta
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        # 1. Validaciones de campos
        if not email or not password:
            return Response(
                {"error": "El email y la nueva contraseña son obligatorios."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Buscar al usuario por email
        try:
            # Importante: Asegúrate de que no haya usuarios con emails duplicados en tu DB
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "No existe un usuario con este correo electrónico."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except User.MultipleObjectsReturned:
            return Response(
                {"error": "Error interno: existen múltiples usuarios con este email."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 3. Validaciones de seguridad de la contraseña
        if len(password) < 8 or password.isdigit():
            return Response({
                "error": "La contraseña debe tener al menos 8 caracteres y no puede ser solo números."
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Cambiar contraseña y guardar
        user.set_password(password)
        user.save()

        return Response(
            {"message": "Contraseña restablecida con éxito. Ya puedes iniciar sesión."}, 
            status=status.HTTP_200_OK
        )

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

class LogoutView(APIView):
    # Sin SessionAuthentication: así evitamos el requisito CSRF en el POST
    # Es seguro porque el peor escenario de un CSRF-logout es que te deslogeen
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Eliminar caché del perfil antes de cerrar sesión
        if request.user.is_authenticated:
            cache.delete(f"perfil_user_{request.user.id}")
        # Destruye la sesión en el servidor y borra la cookie sessionid
        logout(request)
        return Response({"message": "Sesión cerrada correctamente."}, status=status.HTTP_200_OK)