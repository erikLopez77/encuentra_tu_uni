from django.urls import path
from . import views

urlpatterns = [
    path('universidades/', views.UniversidadListView.as_view(), name='universidad-list'),
    path('universidades/<int:pk>/', views.UniversidadDetailView.as_view(), name='universidad-detail'),
    path('register/', views.RegisterView.as_view(), name='register'),
]