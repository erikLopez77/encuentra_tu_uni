from django.urls import path
from .views import FavoritoView, ComentarioView

urlpatterns = [
    # Gestión de Favoritos por verbos HTTP (GET, POST, DELETE) con soporte de caché
    path('favoritos/', FavoritoView.as_view(), name='favoritos'),

    # CRUD de Comentarios por verbos HTTP (GET, POST, PUT, PATCH, DELETE)
    path('universidades/<int:universidad_id>/comentarios/', ComentarioView.as_view(), name='universidad-comentarios'),
]
