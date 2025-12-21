"""
Reservation Service - Lógica de negocio para gestión de reservas.
"""
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


class ReservationService:
    """
    Servicio para gestión de reservas.
    Maneja la creación y conversión de reservas a inversiones.
    """

    RESERVATION_VALIDITY_DAYS = 7

    @classmethod
    def create_reservation(cls, project, email, amount, name='', phone=''):
        """
        Crea una nueva reserva y el lead asociado.

        Args:
            project: Proyecto a reservar
            email: Email del reservante
            amount: Monto a reservar
            name: Nombre (opcional)
            phone: Teléfono (opcional)

        Returns:
            Reservation: Reserva creada

        Raises:
            ValueError: Si el monto es menor al mínimo
        """
        from apps.reservations.models import Reservation
        from apps.leads.services import LeadService

        # Validar monto mínimo
        if amount < project.minimum_investment:
            raise ValueError(
                f"El monto mínimo de inversión es ${project.minimum_investment:,.0f}"
            )

        # Validar que el proyecto esté en financiación
        from apps.projects.models import Project
        if project.status != Project.Status.FUNDING:
            raise ValueError("El proyecto no está disponible para inversión")

        # Crear reserva
        reservation = Reservation.objects.create(
            email=email,
            name=name,
            phone=phone,
            project=project,
            amount=amount,
            expires_at=timezone.now() + timedelta(days=cls.RESERVATION_VALIDITY_DAYS)
        )

        # Crear/actualizar lead
        lead = LeadService.create_lead_from_reservation(reservation)
        reservation.lead = lead
        reservation.save()

        return reservation

    @classmethod
    def convert_to_investment(cls, reservation, user):
        """
        Convierte una reserva en inversión cuando el usuario pasa KYC.

        Args:
            reservation: Reserva a convertir
            user: Usuario que convierte

        Returns:
            Investment: Inversión creada

        Raises:
            ValueError: Si no se puede convertir
        """
        from apps.investments.models import Investment
        from apps.reservations.models import Reservation
        from apps.leads.services import LeadService

        # Validaciones
        if not user.is_kyc_verified:
            raise ValueError("Debe completar la verificación KYC primero")

        if reservation.status != Reservation.Status.PENDING:
            raise ValueError("La reserva no está disponible para conversión")

        if reservation.is_expired:
            reservation.status = Reservation.Status.EXPIRED
            reservation.save()
            raise ValueError("La reserva ha expirado")

        # Verificar que el email coincida
        if reservation.email.lower() != user.email.lower():
            raise ValueError("El email de la reserva no coincide con su cuenta")

        # Crear inversión
        investment = Investment.objects.create(
            user=user,
            project=reservation.project,
            amount=reservation.amount,
            annual_return_rate_snapshot=reservation.project.annual_return_rate,
            duration_months_snapshot=reservation.project.duration_months
        )

        # Actualizar reserva
        reservation.status = Reservation.Status.CONVERTED
        reservation.converted_user = user
        reservation.converted_investment = investment
        reservation.save()

        # Actualizar lead si existe
        if reservation.lead:
            LeadService.convert_lead_to_investor(reservation.lead, user)

        return investment

    @classmethod
    def get_reservation_by_token(cls, token):
        """
        Obtiene una reserva por su token de acceso.

        Args:
            token: Token de acceso

        Returns:
            Reservation o None
        """
        from apps.reservations.models import Reservation

        try:
            return Reservation.objects.select_related('project').get(access_token=token)
        except Reservation.DoesNotExist:
            return None

    @classmethod
    def get_pending_reservations_for_email(cls, email):
        """
        Obtiene las reservas pendientes para un email.

        Args:
            email: Email a buscar

        Returns:
            QuerySet de reservas pendientes
        """
        from apps.reservations.models import Reservation

        return Reservation.objects.filter(
            email__iexact=email,
            status=Reservation.Status.PENDING
        ).select_related('project')

    @classmethod
    def cancel_reservation(cls, reservation):
        """
        Cancela una reserva.

        Args:
            reservation: Reserva a cancelar
        """
        from apps.reservations.models import Reservation

        if reservation.status == Reservation.Status.PENDING:
            reservation.status = Reservation.Status.CANCELLED
            reservation.save()

    @classmethod
    def expire_old_reservations(cls):
        """
        Marca como expiradas las reservas que han pasado su fecha de expiración.
        Este método debería ejecutarse periódicamente (ej: tarea programada).

        Returns:
            int: Número de reservas expiradas
        """
        from apps.reservations.models import Reservation

        expired_count = Reservation.objects.filter(
            status=Reservation.Status.PENDING,
            expires_at__lt=timezone.now()
        ).update(status=Reservation.Status.EXPIRED)

        return expired_count
