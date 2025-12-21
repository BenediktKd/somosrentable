"""
Project serializers for SomosRentable API.
"""
from rest_framework import serializers
from .models import Project, ProjectImage


class ProjectImageSerializer(serializers.ModelSerializer):
    """Serializer para imágenes de proyecto."""

    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'caption', 'order']


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer para lista de proyectos."""

    funding_progress = serializers.DecimalField(
        source='funding_progress_percentage',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    investor_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'short_description', 'location',
            'target_amount', 'current_amount', 'minimum_investment',
            'annual_return_rate', 'duration_months', 'main_image',
            'status', 'status_display', 'funding_progress', 'investor_count',
            'is_featured', 'funding_start_date', 'funding_end_date'
        ]

    def get_main_image(self, obj):
        """Devuelve URL externa o imagen local."""
        if obj.main_image_url:
            return obj.main_image_url
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de proyecto."""

    images = ProjectImageSerializer(many=True, read_only=True)
    funding_progress = serializers.DecimalField(
        source='funding_progress_percentage',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    remaining_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True
    )
    investor_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'description', 'short_description',
            'location', 'address', 'target_amount', 'current_amount',
            'remaining_amount', 'minimum_investment', 'annual_return_rate',
            'duration_months', 'main_image', 'images', 'status', 'status_display',
            'funding_progress', 'investor_count', 'is_featured',
            'funding_start_date', 'funding_end_date',
            'project_start_date', 'project_end_date', 'created_at'
        ]

    def get_main_image(self, obj):
        """Devuelve URL externa o imagen local."""
        if obj.main_image_url:
            return obj.main_image_url
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar proyectos (admin)."""

    class Meta:
        model = Project
        fields = [
            'title', 'slug', 'description', 'short_description',
            'location', 'address', 'target_amount', 'minimum_investment',
            'annual_return_rate', 'duration_months', 'main_image',
            'status', 'is_featured', 'funding_start_date', 'funding_end_date',
            'project_start_date', 'project_end_date'
        ]


class ReturnCalculationSerializer(serializers.Serializer):
    """Serializer para calcular retorno de inversión."""

    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class ReturnProjectionSerializer(serializers.Serializer):
    """Serializer para proyección de retorno."""

    investment = serializers.DecimalField(max_digits=12, decimal_places=2)
    annual_return_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    monthly_return = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_return = serializers.DecimalField(max_digits=12, decimal_places=2)
    final_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    duration_months = serializers.IntegerField()
