"""
middleware.py — API Gateway

JWTAuthenticationMiddleware:
  - Valida Bearer Token (JWT) en rutas que requieren autenticación.
  - Extrae user_id y email y los guarda en request.gateway_user.
  - Los servicios downstream leen X-User-ID / X-User-Email inyectados por el gateway.
"""

import logging
import re

from django.http import JsonResponse
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def _is_public_path(self, path):
        """Determina si la ruta es pública (no requiere autenticación)."""
        for public in settings.PUBLIC_PATHS:
            pattern = public.replace('<int:pk>', r'\d+').replace('<path:subpath>', r'.*')
            if re.match(f'^{pattern}$', path):
                return True
        return False

    def __call__(self, request):
        path = request.path_info

        # Rutas públicas: sin validación de token
        is_public_comments_read = (
            request.method == 'GET'
            and re.match(r'^/api/v1/universidades/\d+/comentarios/$', path)
        )
        if self._is_public_path(path) or is_public_comments_read:
            return self.get_response(request)

        # Extraer token del header Authorization: Bearer <token>
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Se requiere Authorization: Bearer <token>.'},
                status=401,
            )

        token = auth_header.split(' ', 1)[1]

        try:
            validated_token = self.jwt_auth.get_validated_token(token)
            user_id = validated_token.get('user_id')
            if not user_id:
                raise InvalidToken('Token has no user_id claim.')

            # Microservices have separate user databases; propagate the signed user ID.
            request.gateway_user = {'user_id': user_id}

        except (InvalidToken, TokenError) as e:
            logger.warning(f"Token inválido: {e}")
            return JsonResponse(
                {'error': 'Token inválido o expirado.'},
                status=401,
            )
        except Exception as e:
            logger.exception(f"Error validando token: {e}")
            return JsonResponse(
                {'error': 'Error de autenticación.'},
                status=401,
            )

        response = self.get_response(request)
        return response
