"""
Payment serializers for SomosRentable API.
"""
from rest_framework import serializers
from .models import PaymentProof


class PaymentProofSerializer(serializers.ModelSerializer):
    """Serializer para comprobantes de pago."""

    investor_email = serializers.EmailField(source='investment.user.email', read_only=True)
    project_title = serializers.CharField(source='investment.project.title', read_only=True)
    investment_amount = serializers.DecimalField(
        source='investment.amount', max_digits=12, decimal_places=2, read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PaymentProof
        fields = [
            'id', 'investment', 'investor_email', 'project_title', 'investment_amount',
            'proof_image', 'amount', 'bank_name', 'transaction_reference',
            'transaction_date', 'status', 'status_display', 'rejection_reason',
            'reviewed_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'status', 'rejection_reason', 'reviewed_at', 'created_at'
        ]


class PaymentProofUploadSerializer(serializers.ModelSerializer):
    """Serializer para subir comprobante de pago."""

    investment_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = PaymentProof
        fields = [
            'investment_id', 'proof_image', 'amount',
            'bank_name', 'transaction_reference', 'transaction_date', 'notes'
        ]


class PaymentReviewSerializer(serializers.Serializer):
    """Serializer para revisar comprobante de pago."""

    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Debe proporcionar una razón para el rechazo.'
            })
        return attrs
