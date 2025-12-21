"""
Payment views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import PaymentProof
from .serializers import (
    PaymentProofSerializer,
    PaymentProofUploadSerializer,
    PaymentReviewSerializer,
)
from .services import PaymentService
from apps.investments.models import Investment
from apps.users.views import IsAdminOrExecutive


class PaymentProofUploadView(APIView):
    """
    Subir comprobante de pago.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentProofUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            investment = Investment.objects.get(
                pk=serializer.validated_data['investment_id'],
                user=request.user
            )
        except Investment.DoesNotExist:
            return Response(
                {'error': 'Inversión no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if investment.status not in [
            Investment.Status.PENDING_PAYMENT,
            Investment.Status.PAYMENT_REVIEW
        ]:
            return Response(
                {'error': 'La inversión no acepta comprobantes de pago.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_proof = PaymentService.upload_payment_proof(
            investment=investment,
            proof_image=serializer.validated_data['proof_image'],
            amount=serializer.validated_data['amount'],
            bank_name=serializer.validated_data.get('bank_name', ''),
            transaction_reference=serializer.validated_data.get('transaction_reference', ''),
            transaction_date=serializer.validated_data.get('transaction_date'),
            notes=serializer.validated_data.get('notes', '')
        )

        return Response({
            'message': 'Comprobante subido exitosamente. Será revisado por un administrador.',
            'payment': PaymentProofSerializer(payment_proof).data
        }, status=status.HTTP_201_CREATED)


class PendingPaymentsView(generics.ListAPIView):
    """
    Listar comprobantes pendientes de revisión (admin/ejecutivo).
    """
    serializer_class = PaymentProofSerializer
    permission_classes = [IsAdminOrExecutive]

    def get_queryset(self):
        return PaymentProof.objects.filter(
            status=PaymentProof.Status.PENDING
        ).select_related(
            'investment__user', 'investment__project'
        ).order_by('created_at')


class PaymentProofDetailView(generics.RetrieveAPIView):
    """
    Ver detalle de comprobante de pago.
    """
    serializer_class = PaymentProofSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'executive']:
            return PaymentProof.objects.select_related(
                'investment__user', 'investment__project'
            )
        return PaymentProof.objects.filter(
            investment__user=user
        ).select_related('investment__project')


class PaymentReviewView(APIView):
    """
    Aprobar o rechazar comprobante de pago (admin/ejecutivo).
    """
    permission_classes = [IsAdminOrExecutive]

    def post(self, request, pk):
        try:
            payment_proof = PaymentProof.objects.select_related(
                'investment__project'
            ).get(pk=pk)
        except PaymentProof.DoesNotExist:
            return Response(
                {'error': 'Comprobante no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if payment_proof.status != PaymentProof.Status.PENDING:
            return Response(
                {'error': 'Este comprobante ya fue procesado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PaymentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']

        if action == 'approve':
            PaymentService.approve_payment(payment_proof, request.user)
            message = 'Pago aprobado. La inversión ha sido activada.'
        else:
            PaymentService.reject_payment(
                payment_proof,
                request.user,
                serializer.validated_data['rejection_reason']
            )
            message = 'Pago rechazado.'

        payment_proof.refresh_from_db()

        return Response({
            'message': message,
            'payment': PaymentProofSerializer(payment_proof).data
        })
