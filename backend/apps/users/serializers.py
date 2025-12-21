"""
User serializers for SomosRentable API.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer para información de usuario."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'role', 'is_kyc_verified', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_kyc_verified', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=User.Role.INVESTOR
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar perfil de usuario."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Las contraseñas no coinciden.'
            })
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios (admin)."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'is_kyc_verified', 'is_active', 'created_at'
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()
