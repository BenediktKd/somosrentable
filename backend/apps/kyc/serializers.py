"""
KYC serializers for SomosRentable API.
"""
from rest_framework import serializers
from .models import KYCSubmission


class KYCSubmissionSerializer(serializers.ModelSerializer):
    """Serializer para solicitudes KYC."""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = KYCSubmission
        fields = [
            'id', 'user', 'user_email', 'full_name', 'document_number',
            'document_photo', 'status', 'status_display', 'rejection_reason',
            'auto_processed', 'reviewed_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'rejection_reason',
            'auto_processed', 'reviewed_at', 'created_at'
        ]


class KYCSubmitSerializer(serializers.ModelSerializer):
    """Serializer para enviar documentos KYC."""

    class Meta:
        model = KYCSubmission
        fields = ['full_name', 'document_number', 'document_photo']


class KYCStatusSerializer(serializers.ModelSerializer):
    """Serializer para ver estado de KYC."""

    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = KYCSubmission
        fields = [
            'id', 'status', 'status_display', 'rejection_reason',
            'created_at', 'reviewed_at'
        ]


class KYCReviewSerializer(serializers.Serializer):
    """Serializer para revisión manual de KYC."""

    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Debe proporcionar una razón para el rechazo.'
            })
        return attrs
