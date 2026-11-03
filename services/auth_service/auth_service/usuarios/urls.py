from django.urls import path
from . import views
from . import views_jwt

#localhost:8002/api/v1
urlpatterns=[
    path('health/', views.health_check, name='health-check'),
    path('perfil/',views.PerfilCreateDetailView.as_view(),name='perfil'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('retrieve/',views.PasswordResetUpdateView.as_view(), name='retrieve_password'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    # Endpoints JWT (Bearer token)
    path('token/', views_jwt.token_obtain, name='token_obtain'),
    path('token/refresh/', views_jwt.CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', views_jwt.token_verify_me, name='token_verify'),
]
