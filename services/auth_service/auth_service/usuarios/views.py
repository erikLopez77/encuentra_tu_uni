import logging
import os
import pika
from django.db import connection, transaction
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.core.cache import cache
from django.contrib.auth import update_session_auth_hash
from .models import Perfil
from .serializers import PerfilSerializer, RegisterSerializer
from .rabbit import encolar_evento_outbox
from django.contrib.auth.models import User
from .jwt_cookies import ACCESS_COOKIE, REFRESH_COOKIE, clear_jwt_cookies

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint para el servicio de autenticación y usuarios.
    Verifica:
      - Conexión a la base de datos SQLite
      - Conexión y operaciones básicas con Redis (sesiones/caché)
      - Conexión con el broker de RabbitMQ
    """
    checks = {}
    is_healthy = True

    # 1. Base de datos
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
        checks['database'] = {
            'status': 'healthy',
            'detail': 'Conexion a la base de datos exitosa'
        }
    except Exception as e:
        is_healthy = False
        checks['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    # 2. Redis
    try:
        test_key = '__health_ping__'
        cache.set(test_key, 'pong', timeout=10)
        val = cache.get(test_key)
        if val == 'pong':
            checks['redis'] = {
                'status': 'healthy',
                'detail': 'Conexión a Redis exitosa'
            }
        else:
            is_healthy = False
            checks['redis'] = {
                'status': 'unhealthy',
                'error': 'Redis no devolvió el valor esperado'
            }
    except Exception as e:
        is_healthy = False
        checks['redis'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    # 3. RabbitMQ
    try:
        rabbitmq_url = os.environ.get('RABBITMQ_URL', 'amqp://encuentra:encuentra123@localhost:5672/')
        params = pika.URLParameters(rabbitmq_url)
        params.socket_timeout = 2
        conn = pika.BlockingConnection(params)
        conn.close()
        checks['rabbitmq'] = {
            'status': 'healthy',
            'detail': 'Conexión a RabbitMQ exitosa'
        }
    except Exception as e:
        is_healthy = False
        checks['rabbitmq'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    status_code = 200 if is_healthy else 503
    return JsonResponse({
        'service': 'auth_service',
        'status': 'healthy' if is_healthy else 'unhealthy',
        'timestamp': timezone.now().isoformat(),
        'checks': checks
    }, status=status_code)

class PerfilCreateDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PerfilSerializer
    permission_classes = [permissions.AllowAny]  # Permite que cualquier usuario autenticado acceda
    authentication_classes = [JWTAuthentication]

    def get(self, request, *args, **kwargs):
        #  Si no hay sesión activa, respondemos 200 OK con un objeto indicando que no hay sesión
        if not request.user.is_authenticated:
            return Response({"isAuthenticated": False}, status=status.HTTP_200_OK)
        # Si sí está logueado, dejamos que devuelva su perfil normalmente(usamos get_object() )
        return super().get(request, *args, **kwargs)

    #busca, crea, extrae o caahea al usuario
    def get_object(self):
        # Protección extra por si se invoca get_object sin autenticación
        if not self.request.user.is_authenticated:
            return None

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
                logger.warning("Redis no disponible al cachear perfil: %s", e)
        return perfil

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "No autorizado"}, status=status.HTTP_401_UNAUTHORIZED)
        
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

        # Guardamos los cambios del usuario y el evento Outbox en una sola transacción
        # atómica: si algo falla, ni el usuario ni el evento se guardan (consistencia total).
        nombre_cambio = 'first_name' in data or 'last_name' in data
        with transaction.atomic():
            if user_changed:
                user.save()
                # Solo si se cambió la contraseña, actualizamos el hash de sesión
                if 'password' in data:
                    update_session_auth_hash(request, user)

            # Limpiar caché y guardar perfil
            cache.delete(f"perfil_user_{user.id}")
            perfil.save()

            # Outbox Pattern: si cambió el nombre, creamos el evento en la BD
            # (misma transacción). El worker de rabbit.py lo publicará en RabbitMQ.
            # Así, aunque RabbitMQ esté caído, el evento no se pierde.
            if nombre_cambio:
                encolar_evento_outbox('usuario.actualizado', {
                    'evento': 'usuario.actualizado',
                    'user_id': user.id,
                    'perfil_id': perfil.id,
                    'nombre': user.first_name,
                    'apellidos': user.last_name,
                })
                logger.info(
                    "Evento usuario.actualizado encolado | user_id=%s | nombre='%s %s'",
                    user.id, user.first_name, user.last_name,
                )

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

class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        access_token = request.COOKIES.get(ACCESS_COOKIE)
        user_id = None

        access = None
        if access_token:
            try:
                access = AccessToken(access_token)
                user_id = access.get('user_id')
            except (TokenError, InvalidToken, KeyError):
                # Si el access venció, el gateway ya no lo acepta por expiración.
                access = None

        refresh = None
        if refresh_token:
            try:
                refresh = RefreshToken(refresh_token)
                refresh_user_id = refresh.get('user_id')
                if user_id is not None and str(refresh_user_id) != str(user_id):
                    return Response({'error': 'Tokens de sesión inconsistentes.'}, status=status.HTTP_400_BAD_REQUEST)
                user_id = refresh_user_id
            except (TokenError, InvalidToken) as e:
                # Expirado o ya rotado: no es renovable y puede tratarse como revocado.
                logger.info("Refresh ya inválido durante logout: %s", e)

        access_sid = access.get('sid') if access is not None else None
        refresh_sid = refresh.get('sid') if refresh is not None else None
        if access_sid and refresh_sid and access_sid != refresh_sid:
            return Response({'error': 'Tokens de sesión inconsistentes.'}, status=status.HTTP_400_BAD_REQUEST)
        session_id = refresh_sid or access_sid

        # Una única marca de sesión en Redis invalida todos los access tokens
        # emitidos para este login. Redis es obligatorio; ante caída se falla cerrado.
        if session_id or access is not None:
            try:
                expiration = max(
                    int(access['exp']) if access is not None else 0,
                    int(refresh['exp']) if refresh is not None else 0,
                )
                remaining = max(1, expiration - int(timezone.now().timestamp()))
                key = f'blacklisted_session_{session_id}' if session_id else f"blacklisted_jti_{access['jti']}"
                cache.set(key, '1', timeout=remaining)
            except Exception:
                logger.exception('Redis no disponible; logout no completado.')
                return Response(
                    {'error': 'No se pudo completar el cierre de sesión. Intenta de nuevo.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        # La blacklist durable de SimpleJWT impide reutilizar el refresh anterior.
        if refresh is not None:
            try:
                refresh.blacklist()
            except Exception:
                logger.exception('La sesión fue revocada en Redis, pero falló la blacklist del refresh.')
                return Response(
                    {'error': 'La sesión fue cerrada, pero no se pudo confirmar el refresh. Vuelve a iniciar sesión.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        if user_id is not None:
            try:
                cache.delete(f"perfil_user_{user_id}")
            except Exception:
                logger.warning('No se pudo limpiar la caché de perfil durante logout.', exc_info=True)

        response = Response({"message": "Sesión cerrada correctamente."}, status=status.HTTP_200_OK)
        return clear_jwt_cookies(response)
