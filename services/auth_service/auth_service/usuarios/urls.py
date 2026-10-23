from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views
from . import views_jwt
from .soap_services import soap_login_view

#localhost:8002/api/v1
urlpatterns=[
    path('health/', views.health_check, name='health-check'),
    path('perfil/',views.PerfilCreateDetailView.as_view(),name='perfil'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('retrieve/',views.PasswordResetUpdateView.as_view(), name='retrieve_password'),
    path('soap_login/', soap_login_view, name='soap_login'),
    path('logout/', csrf_exempt(views.LogoutView.as_view()), name='logout'),
    # Endpoints JWT (Bearer token)
    path('token/', views_jwt.token_obtain, name='token_obtain'),
    path('token/refresh/', views_jwt.TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', views_jwt.token_verify_me, name='token_verify'),
]