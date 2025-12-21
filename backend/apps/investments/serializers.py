"""
Investment serializers for SomosRentable API.
"""
from rest_framework import serializers
from .models import Investment
from apps.projects.serializers import ProjectListSerializer


class InvestmentSerializer(serializers.ModelSerializer):
    """Serializer para inversiones."""

    project_title = serializers.CharField(source='project.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_projected_return = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    monthly_return = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Investment
        fields = [
            'id', 'project', 'project_title', 'amount', 'status', 'status_display',
            'annual_return_rate_snapshot', 'duration_months_snapshot',
            'expected_return', 'actual_return', 'total_projected_return',
            'monthly_return', 'activated_at', 'expected_end_date', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'expected_return', 'actual_return', 'created_at']


class InvestmentDetailSerializer(InvestmentSerializer):
    """Serializer para detalle de inversión."""

    project = ProjectListSerializer(read_only=True)
    projection = serializers.SerializerMethodField()

    class Meta(InvestmentSerializer.Meta):
        fields = InvestmentSerializer.Meta.fields + ['projection', 'notes']

    def get_projection(self, obj):
        return obj.get_projection()


class InvestmentCreateSerializer(serializers.Serializer):
    """Serializer para crear inversión."""

    project_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
