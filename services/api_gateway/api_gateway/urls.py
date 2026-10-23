from django.contrib import admin
from django.urls import path, include
from gateway import views as gateway_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', gateway_views.health_check, name='health-check'),
    # Proxy hacia auth_service (incluye /perfil/, /register/, /token/, etc.)
    path('api/v1/auth/', gateway_views.proxy_to_auth),
    # Proxy hacia interaction_service (/favoritos/, /comentarios/)
    path('api/v1/favoritos/', gateway_views.proxy_to_interaction),
    # Proxy hacia university_service (/universidades/)
    path('api/v1/universidades/', gateway_views.proxy_to_university),
    path('api/v1/universidades/<path:subpath>/', gateway_views.proxy_to_university),
]