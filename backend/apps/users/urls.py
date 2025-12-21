"""
User URLs for SomosRentable API.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    ProfileView,
    ChangePasswordView,
    LogoutView,
    UserListView,
    InvestorListView,
    UserDetailView,
    ExecutiveListView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Profile
    path('me/', ProfileView.as_view(), name='profile'),
    path('password/change/', ChangePasswordView.as_view(), name='change_password'),

    # Admin
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('investors/', InvestorListView.as_view(), name='investor_list'),
    path('executives/', ExecutiveListView.as_view(), name='executive_list'),
]
