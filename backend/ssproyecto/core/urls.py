from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views
from .soap_services import soap_login_view

urlpatterns = [
    path('universidades/', views.UniversidadListView.as_view(), name='universidad-list'),
    path('universidades/<int:pk>/', views.UniversidadDetailView.as_view(), name='universidad-detail'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('soap_login/', soap_login_view, name='soap_login'),
]