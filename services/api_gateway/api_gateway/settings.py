"""
Django settings for api_gateway project.

API Gateway - punto de entrada único para todos los servicios microservicios.
Responsabilidades:
  - Enrutar peticiones al servicio correspondiente (proxy inverso).
  - Validar Bearer Token (JWT) en peticiones que requieren autenticación.
  - Inyectar headers X-User-ID, X-User-Email a servicios downstream.
"""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-gateway-secret-key-change-in-production')

DEBUG = os.environ.get('DJANGO_DEBUG', 'true').lower() == 'true'

ALLOWED_HOSTS = ['*']

# CORS para el frontend
CORS_ALLOW_CREDENTIALS = True
FRONTEND_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        'FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'
    ).split(',') if origin.strip()
]
CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS
CSRF_TRUSTED_ORIGINS = FRONTEND_ORIGINS

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-user-id',
    'x-user-email',
]
CSRF_COOKIE_NAME = 'csrftoken_auth'
CSRF_COOKIE_HTTPONLY = True
AUTH_COOKIE_SECURE = os.environ.get('AUTH_COOKIE_SECURE', 'true' if not DEBUG else 'false').lower() == 'true'
AUTH_COOKIE_SAMESITE = os.environ.get('AUTH_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SAMESITE = AUTH_COOKIE_SAMESITE
CSRF_COOKIE_SECURE = AUTH_COOKIE_SECURE

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'gateway',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Middleware propio de autenticación JWT del gateway
    'gateway.middleware.JWTAuthenticationMiddleware',
]

ROOT_URLCONF = 'api_gateway.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'api_gateway.wsgi.application'

# Base de datos (solo para sesiones admin del gateway, no crítica)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_api_gateway.sqlite3',
    }
}

# Configuración JWT - debe coincidir con auth_service para validar tokens
SIMPLE_JWT = {
    'SIGNING_KEY': os.environ.get(
        'JWT_SIGNING_KEY',
        os.environ.get(
            'DJANGO_SECRET_KEY',
            'django-insecure-g(sopya(a2o$cmy*@x-!^m&)-y0%nr=*mb7$p+sl97m2#ysvk5',
        ),
    ),
    'VERIFYING_KEY': None,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# URLs de los servicios microservicios (para el proxy)
SERVICE_URLS = {
    'auth': os.environ.get('AUTH_SERVICE_URL', 'http://localhost:8002'),
    'interaction': os.environ.get('INTERACTION_SERVICE_URL', 'http://localhost:8003'),
    'university': os.environ.get('UNIVERSITY_SERVICE_URL', 'http://localhost:8001'),
}

# Configuración de Redis para blacklist de JWT (compartido con auth_service)
REDIS_LOCATION = os.environ.get('REDIS_LOCATION', 'redis://redis:6379/1')
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_LOCATION,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'protocol': 2,
            },
        },
    }
}

# Rutas públicas que no requieren autenticación
PUBLIC_PATHS = [
    '/api/v1/auth/register/',
    '/api/v1/auth/retrieve/',
    '/api/v1/auth/token/',
    '/api/v1/auth/token/refresh/',
    '/api/v1/auth/logout/',
    '/api/v1/auth/csrf/',
    '/api/v1/universidades/',          # listado público de universidades
    '/api/v1/universidades/<int:pk>/', # detalle público de una universidad
    '/health/',
]

# Internacionalización
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
