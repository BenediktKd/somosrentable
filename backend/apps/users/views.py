"""
User views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash

from .models import User
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    UserListSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    Registro de nuevos usuarios (inversionistas).
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generar tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Ver y actualizar perfil del usuario autenticado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    Cambiar contraseña del usuario autenticado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        update_session_auth_hash(request, user)

        return Response({'message': 'Contraseña actualizada exitosamente.'})


class LogoutView(APIView):
    """
    Logout - invalidar refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Sesión cerrada exitosamente.'})
        except Exception:
            return Response({'message': 'Sesión cerrada.'})


# Admin views

class IsAdminOrExecutive(permissions.BasePermission):
    """Permiso para admins y ejecutivos."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.Role.ADMIN, User.Role.EXECUTIVE
        ]


class IsAdmin(permissions.BasePermission):
    """Permiso solo para admins."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN


class UserListView(generics.ListAPIView):
    """
    Listar usuarios (solo admin/ejecutivo).
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset.order_by('-created_at')


class InvestorListView(generics.ListAPIView):
    """
    Listar inversionistas (admin/ejecutivo).
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        queryset = User.objects.filter(role=User.Role.INVESTOR)

        # Ejecutivos solo ven sus inversionistas asignados
        if self.request.user.role == User.Role.EXECUTIVE:
            queryset = queryset.filter(assigned_executive=self.request.user)

        return queryset.order_by('-created_at')


class UserDetailView(generics.RetrieveAPIView):
    """
    Ver detalle de un usuario (admin/ejecutivo).
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdminOrExecutive]
    queryset = User.objects.all()


class ExecutiveListView(generics.ListAPIView):
    """
    Listar ejecutivos (solo admin).
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.filter(role=User.Role.EXECUTIVE, is_active=True)
