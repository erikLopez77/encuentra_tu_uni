"""
views_jwt.py — auth_service

Endpoints JWT para la autenticación stateless con Bearer token.

  POST /api/v1/token/         → recibe {username, password}, devuelve {access, refresh, user_id, nombre, email}
  POST /api/v1/token/refresh/ → recibe {refresh}, devuelve {access}
  GET  /api/v1/token/verify/  → recibe Authorization: Bearer <token>, devuelve info del usuario

Estos endpoints son compatibles con interaction_service y university_service,
que solo necesitan validar el token localmente (sin llamar a auth_service).
"""

import logging
import uuid

from django.contrib.auth import authenticate
from django.core.cache import cache
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.exceptions import ValidationError
from .jwt_cookies import REFRESH_COOKIE, clear_jwt_cookies, set_jwt_cookies

logger = logging.getLogger(__name__)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def token_obtain(request):
    """
    Recibe {username, password} y devuelve {access, refresh, user_id, nombre, email}.

    A diferencia del TokenObtainPairView estándar de simplejwt, aquí incluimos
    datos del perfil en la respuesta para que el frontend no necesite una segunda
    petición al endpoint /perfil/ solo para obtener el nombre.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'Se requiere username y password.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        logger.warning("Intento de login JWT fallido | username=%s", username)
        return Response(
            {'error': 'Credenciales incorrectas.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        cache.get('auth:redis-availability-check')
    except Exception:
        logger.exception('Redis no disponible; no se emite una sesión nueva.')
        return Response(
            {'error': 'El servicio de sesión no está disponible. Intenta más tarde.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    refresh = RefreshToken.for_user(user)
    # Un identificador por sesión de navegador. Permite revocar todos sus access
    # tokens de forma inmediata, incluso durante una renovación concurrente.
    refresh['sid'] = uuid.uuid4().hex
    access = refresh.access_token

    logger.info("Login JWT exitoso | user_id=%s | username=%s", user.id, user.username)
    response = Response({
        'user_id': user.id,
        'username': user.username,
        'nombre': user.first_name,
        'apellidos': user.last_name,
        'email': user.email,
    }, status=status.HTTP_200_OK)
    return set_jwt_cookies(response, str(access), str(refresh))


class CookieTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh:
            return Response({'error': 'No hay sesión renovable.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            cache.get('auth:redis-availability-check')
        except Exception:
            logger.exception('Redis no disponible; no se rota el refresh token.')
            return Response(
                {'error': 'El servicio de sesión no está disponible. Intenta más tarde.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            refresh_token = RefreshToken(refresh)
        except (TokenError, InvalidToken):
            response = Response({'error': 'La sesión expiró o fue revocada.'}, status=status.HTTP_401_UNAUTHORIZED)
            return clear_jwt_cookies(response)
        session_id = refresh_token.get('sid')
        if not session_id:
            response = Response({'error': 'La sesión debe reiniciarse.'}, status=status.HTTP_401_UNAUTHORIZED)
            return clear_jwt_cookies(response)
        try:
            session_revoked = cache.get(f'blacklisted_session_{session_id}')
        except Exception:
            logger.exception('Redis no disponible; no se rota el refresh token.')
            return Response(
                {'error': 'El servicio de sesión no está disponible. Intenta más tarde.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if session_revoked:
            response = Response({'error': 'La sesión fue cerrada.'}, status=status.HTTP_401_UNAUTHORIZED)
            return clear_jwt_cookies(response)
        serializer = TokenRefreshSerializer(data={'refresh': refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            response = Response({'error': 'La sesión expiró o fue revocada.'}, status=status.HTTP_401_UNAUTHORIZED)
            return clear_jwt_cookies(response)
        except Exception:
            logger.exception('No se pudo completar la rotación del refresh token.')
            return Response(
                {'error': 'No se pudo renovar la sesión temporalmente.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        data = serializer.validated_data
        response = Response({'message': 'Sesión renovada.'}, status=status.HTTP_200_OK)
        return set_jwt_cookies(response, data['access'], data.get('refresh'))


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def token_verify_me(request):
    """
    Devuelve la información del usuario autenticado a partir del Bearer token.
    Útil para que el frontend verifique que el token sigue siendo válido.
    """
    user = request.user
    return Response({
        'user_id': user.id,
        'username': user.username,
        'nombre': user.first_name,
        'apellidos': user.last_name,
        'email': user.email,
    }, status=status.HTTP_200_OK)
