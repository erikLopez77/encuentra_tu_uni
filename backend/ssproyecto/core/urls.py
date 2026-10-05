from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views
from .soap_services import soap_login_view

urlpatterns = [
    #path('universidades/<int:universidad_id>/comentarios/', views.ComentarioListCreateView.as_view(), name='comentario-list-create'),
]