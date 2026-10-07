from django.urls import path
from .views import (
    FavoritoListCreateView,
    FavoritoRetrieveDestroyView,
    ComentarioListCreateView,
    ComentarioRetrieveUpdateDestroyView
)

urlpatterns = [
    # Rutas para Favoritos
    path('favoritos/', FavoritoListCreateView.as_view(), name='favorito-list-create'),
    path('favoritos/<int:pk>/', FavoritoRetrieveDestroyView.as_view(), name='favorito-detail'),

    # Rutas para Comentarios
    path('universidades/<int:universidad_id>/comentarios/', ComentarioListCreateView.as_view(), name='comentario-list-create'),
    path('universidades/<int:universidad_id>/comentarios/<int:comentario_id>/', ComentarioRetrieveUpdateDestroyView.as_view(), name='comentario-detail'),
]
