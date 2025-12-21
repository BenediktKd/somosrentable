"""
Lead serializers for SomosRentable API.
"""
from rest_framework import serializers
from .models import Lead, LeadInteraction


class LeadInteractionSerializer(serializers.ModelSerializer):
    """Serializer para interacciones con leads."""

    executive_name = serializers.CharField(source='executive.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_interaction_type_display', read_only=True)

    class Meta:
        model = LeadInteraction
        fields = [
            'id', 'interaction_type', 'type_display', 'description',
            'outcome', 'executive_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LeadSerializer(serializers.ModelSerializer):
    """Serializer para leads."""

    source_display = serializers.CharField(source='get_source_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    project_title = serializers.CharField(source='interested_project.title', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'email', 'name', 'phone', 'source', 'source_display',
            'source_detail', 'status', 'status_display', 'assigned_to',
            'assigned_to_name', 'assigned_at', 'interested_project',
            'project_title', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'source', 'assigned_to', 'assigned_at', 'created_at', 'updated_at']


class LeadDetailSerializer(LeadSerializer):
    """Serializer para detalle de lead con interacciones."""

    interactions = LeadInteractionSerializer(many=True, read_only=True)
    converted_user_email = serializers.EmailField(source='converted_user.email', read_only=True)

    class Meta(LeadSerializer.Meta):
        fields = LeadSerializer.Meta.fields + [
            'interactions', 'converted_user', 'converted_user_email',
            'converted_at', 'webhook_data'
        ]


class LeadUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar lead."""

    class Meta:
        model = Lead
        fields = ['name', 'phone', 'status', 'notes', 'interested_project']


class LeadWebhookSerializer(serializers.Serializer):
    """Serializer para recibir leads desde webhook."""

    email = serializers.EmailField()
    name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    source = serializers.CharField(required=False, allow_blank=True)
    source_detail = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class LeadAssignSerializer(serializers.Serializer):
    """Serializer para asignar lead a ejecutivo."""

    executive_id = serializers.UUIDField()
