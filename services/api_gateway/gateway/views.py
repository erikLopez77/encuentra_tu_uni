"""
views.py — API Gateway

Vistas proxy que reenvían peticiones a los servicios microservicios.
Inyectan headers X-User-ID y X-User-Email cuando el usuario está autenticado.
"""

import logging

import requests
from django.http import HttpResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


def _forward_request(request, service_url, path_prefix='', upstream_prefix=None):
    """
    Reenvía la petición al servicio indicado.

    - service_url: base URL del microservicio (ej. http://localhost:8002)
    - path_prefix: prefijo a quitar de la URL antes de reenviar (ej. '/api/v1/auth/')
    """
    # Construir la ruta destino: quitar el prefijo del gateway y dejar el resto
    full_path = request.get_full_path()  # incluye query string

    # Map the public prefix to the path expected by the microservice.
    target_path = full_path
    if path_prefix and full_path.startswith(path_prefix):
        suffix = full_path[len(path_prefix):]
        target_path = (upstream_prefix if upstream_prefix is not None else path_prefix) + suffix

    target_url = service_url.rstrip('/') + target_path

    # Preparar headers: reenviar Authorization y Content-Type, inyectar X-User-ID/Email
    # Docker service names use underscores, which Django rejects as HTTP_HOST.
    # The URL still targets the Docker hostname; this is only the Host header.
    headers = {'Host': 'localhost'}
    if 'Authorization' in request.headers:
        headers['Authorization'] = request.headers['Authorization']
    if 'Content-Type' in request.headers:
        headers['Content-Type'] = request.headers['Content-Type']

    # Inyectar identidad del usuario si está disponible
    gateway_user = getattr(request, 'gateway_user', None)
    if gateway_user:
        headers['X-User-ID'] = str(gateway_user['user_id'])
        headers['X-User-Email'] = gateway_user.get('email', '')

    # Determinar método HTTP y body
    method = request.method.upper()
    body = request.body if method in ('POST', 'PUT', 'PATCH', 'DELETE') else None

    try:
        resp = requests.request(
            method=method,
            url=target_url,
            headers=headers,
            data=body,
            timeout=30,
            allow_redirects=False,
        )
    except requests.exceptions.ConnectionError:
        logger.error(f"No se pudo conectar con {service_url}")
        return HttpResponse(
            f'Servicio no disponible: {service_url}',
            status=502,
            content_type='text/plain',
        )
    except requests.exceptions.Timeout:
        logger.error(f"Timeout conectando con {service_url}")
        return HttpResponse(
            'Timeout del servicio upstream',
            status=504,
            content_type='text/plain',
        )

    # Devolver la respuesta del microservicio al cliente
    excluded_headers = {'content-type', 'content-encoding', 'transfer-encoding', 'connection'}
    response_headers = [
        (k, v) for k, v in resp.headers.items()
        if k.lower() not in excluded_headers
    ]

    return HttpResponse(
        resp.content,
        status=resp.status_code,
        content_type=resp.headers.get('Content-Type', 'application/json'),
        headers=response_headers,
    )


@csrf_exempt
def health_check(request):
    """Health check del gateway."""
    return HttpResponse(
        '{"service": "api_gateway", "status": "healthy"}',
        content_type='application/json',
        status=200,
    )


@csrf_exempt
def proxy_to_auth(request, subpath=''):
    """Proxy hacia auth_service (login, register, perfil, token, etc.)."""
    return _forward_request(
        request,
        settings.SERVICE_URLS['auth'],
        path_prefix='/api/v1/auth/',
        upstream_prefix='/api/v1/',
    )


@csrf_exempt
def proxy_to_interaction(request, subpath=''):
    """Proxy hacia interaction_service (favoritos, comentarios)."""
    return _forward_request(
        request,
        settings.SERVICE_URLS['interaction'],
        path_prefix='/api/v1/favoritos/',
        upstream_prefix='/api/v1/favoritos/',
    )


@csrf_exempt
def proxy_to_university(request, subpath=''):
    """Proxy hacia university_service (listado/detalle de universidades)."""
    return _forward_request(
        request,
        settings.SERVICE_URLS['university'],
        path_prefix='/api/v1/universidades/',
        upstream_prefix='/api/v1/universidades/',
    )
