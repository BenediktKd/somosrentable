"""
KYC views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import KYCSubmission
from .serializers import (
    KYCSubmissionSerializer,
    KYCSubmitSerializer,
    KYCStatusSerializer,
    KYCReviewSerializer,
)
from .services import KYCService
from apps.users.views import IsAdminOrExecutive


class KYCStatusView(APIView):
    """
    Ver estado de KYC del usuario autenticado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Obtener última solicitud KYC
        submission = KYCSubmission.objects.filter(
            user=request.user
        ).order_by('-created_at').first()

        if not submission:
            return Response({
                'has_submission': False,
                'is_verified': request.user.is_kyc_verified,
                'can_submit': True,
                'submission': None
            })

        can_submit, message = KYCService.can_submit_kyc(request.user)

        return Response({
            'has_submission': True,
            'is_verified': request.user.is_kyc_verified,
            'can_submit': can_submit,
            'message': message,
            'submission': KYCStatusSerializer(submission).data
        })


class KYCSubmitView(generics.CreateAPIView):
    """
    Enviar documentos para verificación KYC.
    """
    serializer_class = KYCSubmitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Verificar si puede enviar
        can_submit, message = KYCService.can_submit_kyc(request.user)
        if not can_submit:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Crear solicitud
        submission = KYCSubmission.objects.create(
            user=request.user,
            **serializer.validated_data
        )

        # Simular verificación automática (80/20)
        is_approved = KYCService.simulate_verification(submission)

        # Recargar para obtener datos actualizados
        submission.refresh_from_db()

        return Response({
            'message': 'Verificación completada.' if is_approved else 'Verificación rechazada.',
            'submission': KYCStatusSerializer(submission).data
        }, status=status.HTTP_201_CREATED)


class KYCSubmissionListView(generics.ListAPIView):
    """
    Listar solicitudes KYC (admin/ejecutivo).
    """
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        queryset = KYCSubmission.objects.select_related('user')

        # Filtrar por estado
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')


class KYCSubmissionDetailView(generics.RetrieveAPIView):
    """
    Ver detalle de solicitud KYC (admin/ejecutivo).
    """
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsAdminOrExecutive]
    queryset = KYCSubmission.objects.select_related('user')


class KYCReviewView(APIView):
    """
    Aprobar o rechazar solicitud KYC manualmente.
    """
    permission_classes = [IsAdminOrExecutive]

    def post(self, request, pk):
        try:
            submission = KYCSubmission.objects.get(pk=pk)
        except KYCSubmission.DoesNotExist:
            return Response(
                {'error': 'Solicitud no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if submission.status != KYCSubmission.Status.PENDING:
            return Response(
                {'error': 'Esta solicitud ya fue procesada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = KYCReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']

        if action == 'approve':
            KYCService.manual_approve(submission, request.user)
            message = 'Solicitud aprobada exitosamente.'
        else:
            KYCService.manual_reject(
                submission,
                request.user,
                serializer.validated_data['rejection_reason']
            )
            message = 'Solicitud rechazada.'

        submission.refresh_from_db()

        return Response({
            'message': message,
            'submission': KYCSubmissionSerializer(submission).data
        })
