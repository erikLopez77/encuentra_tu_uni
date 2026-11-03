"""Helpers para emitir y borrar cookies JWT HttpOnly."""

from django.conf import settings
from rest_framework_simplejwt.settings import api_settings


ACCESS_COOKIE = 'access_token'
REFRESH_COOKIE = 'refresh_token'
REFRESH_COOKIE_PATH = '/api/v1/auth/'


def _cookie_options(path, max_age):
    return {
        'max_age': max_age,
        'httponly': True,
        'secure': getattr(settings, 'AUTH_COOKIE_SECURE', not settings.DEBUG),
        'samesite': getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax'),
        'path': path,
    }


def set_jwt_cookies(response, access, refresh=None):
    access_age = int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds())
    refresh_age = int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds())
    response.set_cookie(ACCESS_COOKIE, access, **_cookie_options('/', access_age))
    if refresh:
        response.set_cookie(
            REFRESH_COOKIE,
            refresh,
            **_cookie_options(REFRESH_COOKIE_PATH, refresh_age),
        )
    return response


def clear_jwt_cookies(response):
    samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    # Django delete_cookie no acepta secure; conserva Path/SameSite para que
    # la eliminación coincida con las cookies emitidas en set_jwt_cookies.
    response.delete_cookie(ACCESS_COOKIE, path='/', samesite=samesite)
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, samesite=samesite)
    return response
