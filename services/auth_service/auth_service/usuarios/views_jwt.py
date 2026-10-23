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

from django.contrib.auth import authenticate
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

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

    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    logger.info("Login JWT exitoso | user_id=%s | username=%s", user.id, user.username)
    return Response({
        'access': str(access),
        'refresh': str(refresh),
        'user_id': user.id,
        'username': user.username,
        'nombre': user.first_name,
        'apellidos': user.last_name,
        'email': user.email,
    }, status=status.HTTP_200_OK)


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
