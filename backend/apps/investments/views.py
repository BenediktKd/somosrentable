"""
Investment views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Investment
from .serializers import (
    InvestmentSerializer,
    InvestmentDetailSerializer,
    InvestmentCreateSerializer,
)
from apps.projects.models import Project
from apps.users.models import User


class InvestorPermission(permissions.BasePermission):
    """Permiso para inversionistas verificados."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == User.Role.INVESTOR
        )


class VerifiedInvestorPermission(InvestorPermission):
    """Permiso para inversionistas con KYC verificado."""

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_kyc_verified


class InvestmentListView(generics.ListAPIView):
    """
    Listar mis inversiones.
    """
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Investment.objects.filter(
            user=self.request.user
        ).select_related('project').order_by('-created_at')


class InvestmentDetailView(generics.RetrieveAPIView):
    """
    Ver detalle de inversión.
    """
    serializer_class = InvestmentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Investment.objects.filter(
            user=self.request.user
        ).select_related('project')


class InvestmentCreateView(APIView):
    """
    Crear nueva inversión (requiere KYC verificado).
    """
    permission_classes = [VerifiedInvestorPermission]

    def post(self, request):
        serializer = InvestmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            project = Project.objects.get(pk=serializer.validated_data['project_id'])
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        amount = serializer.validated_data['amount']

        # Validaciones
        if project.status != Project.Status.FUNDING:
            return Response(
                {'error': 'El proyecto no está disponible para inversión.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount < project.minimum_investment:
            return Response(
                {'error': f'El monto mínimo de inversión es ${project.minimum_investment:,.0f}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear inversión
        investment = Investment.objects.create(
            user=request.user,
            project=project,
            amount=amount,
            annual_return_rate_snapshot=project.annual_return_rate,
            duration_months_snapshot=project.duration_months
        )

        return Response({
            'message': 'Inversión creada. Suba su comprobante de pago para activarla.',
            'investment': InvestmentSerializer(investment).data
        }, status=status.HTTP_201_CREATED)


class InvestmentProjectionView(APIView):
    """
    Ver proyección de rentabilidad de una inversión.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            investment = Investment.objects.get(pk=pk, user=request.user)
        except Investment.DoesNotExist:
            return Response(
                {'error': 'Inversión no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(investment.get_projection())
