"""
middleware.py — API Gateway

JWTAuthenticationMiddleware:
  - Valida Bearer Token (JWT) en rutas que requieren autenticación.
  - Verifica que el JTI no esté en la blacklist de Redis (revocado por logout).
  - Extrae user_id y email y los guarda en request.gateway_user.
  - Los servicios downstream leen X-User-ID / X-User-Email inyectados por el gateway.
"""

import logging
import re

from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
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

        # En navegador, el access viaja en cookie HttpOnly. Se mantiene Bearer
        # como compatibilidad para clientes de servicio a servicio.
        auth_header = request.headers.get('Authorization', '')
        token = request.COOKIES.get('access_token')
        if not token and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
        if not token:
            return JsonResponse(
                {'error': 'Se requiere una sesión válida.'},
                status=401,
            )

        try:
            validated_token = self.jwt_auth.get_validated_token(token)
            user_id = validated_token.get('user_id')
            if not user_id:
                raise InvalidToken('Token has no user_id claim.')

            # Revoca la sesión completa al cerrar sesión; JTI cubre tokens antiguos sin sid.
            jti = validated_token.get('jti')
            session_id = validated_token.get('sid')
            if jti or session_id:
                try:
                    revoked = (
                        cache.get(f'blacklisted_session_{session_id}')
                        if session_id else cache.get(f'blacklisted_jti_{jti}')
                    )
                except Exception:
                    logger.exception('Redis no disponible; se rechaza la autenticación.')
                    return JsonResponse(
                        {'error': 'Servicio de sesión temporalmente no disponible.'},
                        status=503,
                    )
                if revoked:
                    logger.warning("Sesión revocada | user_id=%s | sid=%s", user_id, session_id)
                    return JsonResponse({'error': 'Sesión revocada. Inicia sesión nuevamente.'}, status=401)

            # Microservices have separate user databases; propagate the signed user ID.
            request.gateway_user = {'user_id': user_id}
            request.gateway_access_token = token

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
