"""
Lead Service - Lógica de negocio para gestión de leads.
"""
from django.utils import timezone
from django.db.models import Count, Q


class LeadService:
    """
    Servicio para gestión de leads.
    Implementa asignación round-robin a ejecutivos.
    """

    @classmethod
    def assign_lead_to_executive(cls, lead):
        """
        Asigna un lead a un ejecutivo usando round-robin.
        Asigna al ejecutivo con menos leads activos.

        Args:
            lead: Instancia de Lead

        Returns:
            User: Ejecutivo asignado o None
        """
        from apps.users.models import User
        from apps.leads.models import Lead

        # Obtener ejecutivos ordenados por cantidad de leads activos
        executives = User.objects.filter(
            role=User.Role.EXECUTIVE,
            is_active=True
        ).annotate(
            active_leads_count=Count(
                'assigned_leads',
                filter=~Q(assigned_leads__status__in=[
                    Lead.Status.CONVERTED,
                    Lead.Status.NOT_INTERESTED,
                    Lead.Status.INVALID
                ])
            )
        ).order_by('active_leads_count')

        if executives.exists():
            executive = executives.first()
            lead.assigned_to = executive
            lead.assigned_at = timezone.now()
            lead.save()
            return executive

        return None

    @classmethod
    def create_lead_from_reservation(cls, reservation):
        """
        Crea un lead a partir de una reserva.

        Args:
            reservation: Instancia de Reservation

        Returns:
            Lead: Lead creado o existente
        """
        from apps.leads.models import Lead

        # Verificar si ya existe lead con este email
        existing_lead = Lead.objects.filter(email=reservation.email).first()

        if existing_lead:
            # Actualizar lead existente si no está convertido
            if existing_lead.status != Lead.Status.CONVERTED:
                existing_lead.interested_project = reservation.project
                if not existing_lead.name and reservation.name:
                    existing_lead.name = reservation.name
                if not existing_lead.phone and reservation.phone:
                    existing_lead.phone = reservation.phone
                existing_lead.save()
            return existing_lead

        # Crear nuevo lead
        lead = Lead.objects.create(
            email=reservation.email,
            name=reservation.name,
            phone=reservation.phone,
            source=Lead.Source.RESERVATION,
            interested_project=reservation.project
        )

        # Asignar a ejecutivo
        cls.assign_lead_to_executive(lead)

        return lead

    @classmethod
    def create_lead_from_webhook(cls, data):
        """
        Crea un lead desde el webhook externo.

        Args:
            data: Dict con datos del webhook

        Returns:
            tuple: (Lead, bool) - (lead, es_nuevo)
        """
        from apps.leads.models import Lead

        # Verificar si ya existe
        existing = Lead.objects.filter(email=data['email']).first()
        if existing:
            return existing, False

        lead = Lead.objects.create(
            email=data['email'],
            name=data.get('name', ''),
            phone=data.get('phone', ''),
            source=Lead.Source.WEBHOOK,
            source_detail=data.get('source', ''),
            webhook_data=data,
            notes=data.get('notes', '')
        )

        cls.assign_lead_to_executive(lead)

        return lead, True

    @classmethod
    def convert_lead_to_investor(cls, lead, user):
        """
        Convierte un lead en inversionista.

        Args:
            lead: Instancia de Lead
            user: Usuario registrado

        Returns:
            Lead: Lead actualizado
        """
        from apps.leads.models import Lead

        lead.converted_user = user
        lead.converted_at = timezone.now()
        lead.status = Lead.Status.CONVERTED
        lead.save()

        # Si el usuario no tiene ejecutivo asignado, asignar el del lead
        if not user.assigned_executive and lead.assigned_to:
            user.assigned_executive = lead.assigned_to
            user.save()

        return lead

    @classmethod
    def get_or_create_lead_for_email(cls, email, source='website', **kwargs):
        """
        Obtiene o crea un lead para un email.

        Args:
            email: Email del lead
            source: Fuente del lead
            **kwargs: Datos adicionales (name, phone, etc.)

        Returns:
            tuple: (Lead, bool) - (lead, es_nuevo)
        """
        from apps.leads.models import Lead

        lead, created = Lead.objects.get_or_create(
            email=email,
            defaults={
                'source': source,
                'name': kwargs.get('name', ''),
                'phone': kwargs.get('phone', ''),
                'source_detail': kwargs.get('source_detail', ''),
            }
        )

        if created:
            cls.assign_lead_to_executive(lead)

        return lead, created
