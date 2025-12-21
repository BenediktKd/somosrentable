"""
Payment Service - Lógica de negocio para gestión de pagos.
"""
from django.utils import timezone
from datetime import timedelta


class PaymentService:
    """
    Servicio para gestión de comprobantes de pago.
    """

    @classmethod
    def approve_payment(cls, payment_proof, reviewer):
        """
        Aprueba un comprobante de pago y activa la inversión.

        Args:
            payment_proof: Instancia de PaymentProof
            reviewer: Usuario que aprueba

        Returns:
            Investment: Inversión activada
        """
        from apps.payments.models import PaymentProof
        from apps.investments.models import Investment

        # Actualizar comprobante
        payment_proof.status = PaymentProof.Status.APPROVED
        payment_proof.reviewed_by = reviewer
        payment_proof.reviewed_at = timezone.now()
        payment_proof.save()

        # Activar inversión
        investment = payment_proof.investment
        investment.status = Investment.Status.ACTIVE
        investment.activated_at = timezone.now()
        investment.expected_end_date = (
            timezone.now() + timedelta(days=30 * investment.duration_months_snapshot)
        ).date()
        investment.save()

        # Actualizar monto recaudado del proyecto
        project = investment.project
        project.current_amount += investment.amount
        project.save()

        return investment

    @classmethod
    def reject_payment(cls, payment_proof, reviewer, reason):
        """
        Rechaza un comprobante de pago.

        Args:
            payment_proof: Instancia de PaymentProof
            reviewer: Usuario que rechaza
            reason: Razón del rechazo
        """
        from apps.payments.models import PaymentProof
        from apps.investments.models import Investment

        payment_proof.status = PaymentProof.Status.REJECTED
        payment_proof.reviewed_by = reviewer
        payment_proof.reviewed_at = timezone.now()
        payment_proof.rejection_reason = reason
        payment_proof.save()

        # Volver inversión a estado pendiente de pago
        investment = payment_proof.investment
        investment.status = Investment.Status.PENDING_PAYMENT
        investment.save()

    @classmethod
    def upload_payment_proof(cls, investment, proof_image, amount, **kwargs):
        """
        Sube un nuevo comprobante de pago para una inversión.

        Args:
            investment: Inversión asociada
            proof_image: Imagen del comprobante
            amount: Monto del pago
            **kwargs: bank_name, transaction_reference, transaction_date, notes

        Returns:
            PaymentProof: Comprobante creado
        """
        from apps.payments.models import PaymentProof
        from apps.investments.models import Investment

        # Crear comprobante
        payment_proof = PaymentProof.objects.create(
            investment=investment,
            proof_image=proof_image,
            amount=amount,
            bank_name=kwargs.get('bank_name', ''),
            transaction_reference=kwargs.get('transaction_reference', ''),
            transaction_date=kwargs.get('transaction_date'),
            notes=kwargs.get('notes', '')
        )

        # Actualizar estado de la inversión
        investment.status = Investment.Status.PAYMENT_REVIEW
        investment.save()

        return payment_proof
