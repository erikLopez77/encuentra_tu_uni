#soap_login, register, retrieve, perfil, logout
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views
from .soap_services import soap_login_view

#localhost:8002/api/v1
urlpatterns=[
    path('perfil/',views.PerfilCreateDetailView.as_view(),name='perfil'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('retrieve/',views.PasswordResetUpdateView.as_view(), name='retrieve_password'),
    path('soap_login/', soap_login_view, name='soap_login'),
    path('logout/', csrf_exempt(views.LogoutView.as_view()), name='logout'),
]