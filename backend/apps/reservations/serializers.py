"""
Reservation serializers for SomosRentable API.
"""
from rest_framework import serializers
from .models import Reservation
from apps.projects.serializers import ProjectListSerializer


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer para reservas."""

    project_title = serializers.CharField(source='project.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    can_convert = serializers.BooleanField(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'email', 'name', 'phone', 'project', 'project_title',
            'amount', 'status', 'status_display', 'access_token',
            'expires_at', 'is_expired', 'can_convert', 'created_at'
        ]
        read_only_fields = [
            'id', 'status', 'access_token', 'expires_at', 'created_at'
        ]


class ReservationDetailSerializer(ReservationSerializer):
    """Serializer para detalle de reserva."""

    project = ProjectListSerializer(read_only=True)

    class Meta(ReservationSerializer.Meta):
        pass


class ReservationCreateSerializer(serializers.Serializer):
    """Serializer para crear reserva."""

    email = serializers.EmailField()
    name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    project_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class ReservationConvertSerializer(serializers.Serializer):
    """Serializer para convertir reserva a inversión."""

    token = serializers.CharField()
