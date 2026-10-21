from django.urls import path
from . import views
#api/v1/ + this

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('universidades/', views.UniversidadListView.as_view(), name='universidad-list'),
    path('universidades/<int:pk>/', views.UniversidadDetailView.as_view(), name='universidad-detail'),
]