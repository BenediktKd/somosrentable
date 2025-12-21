"""
KYC Service - Lógica de negocio para verificación KYC.
"""
import random
from django.utils import timezone


class KYCService:
    """
    Servicio para procesamiento de KYC.
    Implementa la simulación de verificación con 80% de aprobación.
    """

    APPROVAL_PROBABILITY = 0.8  # 80% de aprobación

    @classmethod
    def simulate_verification(cls, submission):
        """
        Simula la verificación KYC con 80% de aprobación.
        En producción, esto se conectaría a un servicio real de verificación.

        Args:
            submission: Instancia de KYCSubmission

        Returns:
            bool: True si aprobado, False si rechazado
        """
        from apps.kyc.models import KYCSubmission

        # Simular verificación con probabilidad 80/20
        is_approved = random.random() < cls.APPROVAL_PROBABILITY

        submission.auto_processed = True
        submission.reviewed_at = timezone.now()

        if is_approved:
            submission.status = KYCSubmission.Status.APPROVED
            # Marcar usuario como verificado
            submission.user.is_kyc_verified = True
            submission.user.save()
        else:
            submission.status = KYCSubmission.Status.REJECTED
            submission.rejection_reason = (
                "La verificación automática no pudo confirmar su identidad. "
                "Por favor, intente nuevamente con una foto más clara de su documento."
            )

        submission.save()

        return is_approved

    @classmethod
    def can_submit_kyc(cls, user):
        """
        Verifica si el usuario puede enviar una nueva solicitud KYC.

        Args:
            user: Instancia de User

        Returns:
            tuple: (bool, str) - (puede_enviar, mensaje_error)
        """
        from apps.kyc.models import KYCSubmission

        # Ya está verificado
        if user.is_kyc_verified:
            return False, "Ya tiene KYC verificado"

        # Tiene solicitud pendiente
        pending = KYCSubmission.objects.filter(
            user=user,
            status=KYCSubmission.Status.PENDING
        ).exists()

        if pending:
            return False, "Tiene una solicitud pendiente de revisión"

        return True, None

    @classmethod
    def manual_approve(cls, submission, reviewer):
        """
        Aprueba manualmente una solicitud KYC.

        Args:
            submission: Instancia de KYCSubmission
            reviewer: Usuario que aprueba
        """
        from apps.kyc.models import KYCSubmission

        submission.status = KYCSubmission.Status.APPROVED
        submission.reviewed_by = reviewer
        submission.reviewed_at = timezone.now()
        submission.auto_processed = False
        submission.save()

        # Marcar usuario como verificado
        submission.user.is_kyc_verified = True
        submission.user.save()

    @classmethod
    def manual_reject(cls, submission, reviewer, reason):
        """
        Rechaza manualmente una solicitud KYC.

        Args:
            submission: Instancia de KYCSubmission
            reviewer: Usuario que rechaza
            reason: Razón del rechazo
        """
        from apps.kyc.models import KYCSubmission

        submission.status = KYCSubmission.Status.REJECTED
        submission.reviewed_by = reviewer
        submission.reviewed_at = timezone.now()
        submission.rejection_reason = reason
        submission.auto_processed = False
        submission.save()
