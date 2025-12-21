"""
Lead views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone

from .models import Lead, LeadInteraction
from .serializers import (
    LeadSerializer,
    LeadDetailSerializer,
    LeadUpdateSerializer,
    LeadWebhookSerializer,
    LeadInteractionSerializer,
    LeadAssignSerializer,
)
from .services import LeadService
from apps.users.models import User
from apps.users.views import IsAdminOrExecutive, IsAdmin


class LeadListView(generics.ListAPIView):
    """
    Listar leads (admin/ejecutivo).
    """
    serializer_class = LeadSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        queryset = Lead.objects.select_related(
            'assigned_to', 'interested_project'
        )

        # Ejecutivos solo ven sus leads
        if self.request.user.role == User.Role.EXECUTIVE:
            queryset = queryset.filter(assigned_to=self.request.user)

        # Filtros
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)

        return queryset.order_by('-created_at')


class MyLeadsView(generics.ListAPIView):
    """
    Listar mis leads asignados (ejecutivo).
    """
    serializer_class = LeadSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        return Lead.objects.filter(
            assigned_to=self.request.user
        ).select_related('interested_project').order_by('-created_at')


class LeadDetailView(generics.RetrieveUpdateAPIView):
    """
    Ver y actualizar lead (admin/ejecutivo).
    """
    permission_classes = [IsAdminOrExecutive]
    queryset = Lead.objects.select_related(
        'assigned_to', 'interested_project', 'converted_user'
    ).prefetch_related('interactions')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return LeadUpdateSerializer
        return LeadDetailSerializer


class LeadAssignView(APIView):
    """
    Asignar lead a ejecutivo (admin).
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            lead = Lead.objects.get(pk=pk)
        except Lead.DoesNotExist:
            return Response(
                {'error': 'Lead no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = LeadAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            executive = User.objects.get(
                pk=serializer.validated_data['executive_id'],
                role=User.Role.EXECUTIVE,
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Ejecutivo no encontrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        lead.assigned_to = executive
        lead.assigned_at = timezone.now()
        lead.save()

        return Response({
            'message': f'Lead asignado a {executive.get_full_name()}',
            'lead': LeadSerializer(lead).data
        })


class LeadInteractionCreateView(generics.CreateAPIView):
    """
    Agregar interacción a lead (admin/ejecutivo).
    """
    serializer_class = LeadInteractionSerializer
    permission_classes = [IsAdminOrExecutive]

    def perform_create(self, serializer):
        lead_id = self.kwargs.get('pk')
        lead = Lead.objects.get(pk=lead_id)
        serializer.save(lead=lead, executive=self.request.user)


class LeadInteractionListView(generics.ListAPIView):
    """
    Ver interacciones de un lead.
    """
    serializer_class = LeadInteractionSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        lead_id = self.kwargs.get('pk')
        return LeadInteraction.objects.filter(lead_id=lead_id).order_by('-created_at')


class WebhookAPIKeyPermission(permissions.BasePermission):
    """Permiso para webhook con API key."""

    def has_permission(self, request, view):
        api_key = request.headers.get('X-API-Key')
        return api_key == settings.WEBHOOK_API_KEY


class LeadWebhookView(APIView):
    """
    Recibir leads desde webhook externo.
    """
    permission_classes = [WebhookAPIKeyPermission]

    def post(self, request):
        serializer = LeadWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lead, created = LeadService.create_lead_from_webhook(serializer.validated_data)

        if created:
            return Response({
                'message': 'Lead creado exitosamente.',
                'lead_id': str(lead.id)
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Lead ya existe.',
                'lead_id': str(lead.id)
            }, status=status.HTTP_409_CONFLICT)
