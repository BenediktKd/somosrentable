"""
Statistics Service - Cálculo de estadísticas de la plataforma.
"""
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


class StatisticsService:
    """
    Servicio para calcular estadísticas de la plataforma.
    Todas las estadísticas se calculan en tiempo real.
    """

    @classmethod
    def get_platform_statistics(cls):
        """
        Obtiene estadísticas generales de la plataforma.

        Returns:
            dict: Estadísticas de usuarios, proyectos, inversiones y leads
        """
        from apps.users.models import User
        from apps.projects.models import Project
        from apps.investments.models import Investment
        from apps.leads.models import Lead

        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        # Usuarios
        total_investors = User.objects.filter(role=User.Role.INVESTOR).count()
        verified_investors = User.objects.filter(
            role=User.Role.INVESTOR,
            is_kyc_verified=True
        ).count()
        new_investors_30d = User.objects.filter(
            role=User.Role.INVESTOR,
            created_at__gte=last_30_days
        ).count()

        # Proyectos
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(
            status__in=[Project.Status.FUNDING, Project.Status.IN_PROGRESS]
        ).count()
        completed_projects = Project.objects.filter(
            status=Project.Status.COMPLETED
        ).count()

        # Inversiones
        investments_data = Investment.objects.filter(
            status=Investment.Status.ACTIVE
        ).aggregate(
            total_invested=Sum('amount'),
            total_count=Count('id'),
            avg_investment=Avg('amount')
        )

        new_investments_30d = Investment.objects.filter(
            activated_at__gte=last_30_days,
            status=Investment.Status.ACTIVE
        ).aggregate(
            amount=Sum('amount'),
            count=Count('id')
        )

        total_returns = Investment.objects.filter(
            status__in=[Investment.Status.ACTIVE, Investment.Status.COMPLETED]
        ).aggregate(
            expected=Sum('expected_return'),
            actual=Sum('actual_return')
        )

        # Leads
        total_leads = Lead.objects.count()
        converted_leads = Lead.objects.filter(status=Lead.Status.CONVERTED).count()
        new_leads_30d = Lead.objects.filter(created_at__gte=last_30_days).count()

        conversion_rate = (
            (converted_leads / total_leads * 100) if total_leads > 0 else 0
        )

        verification_rate = (
            (verified_investors / total_investors * 100) if total_investors > 0 else 0
        )

        return {
            'users': {
                'total_investors': total_investors,
                'verified_investors': verified_investors,
                'new_investors_30d': new_investors_30d,
                'verification_rate': round(verification_rate, 2)
            },
            'projects': {
                'total': total_projects,
                'active': active_projects,
                'completed': completed_projects
            },
            'investments': {
                'total_amount': investments_data['total_invested'] or Decimal('0'),
                'total_count': investments_data['total_count'] or 0,
                'average_amount': investments_data['avg_investment'] or Decimal('0'),
                'new_amount_30d': new_investments_30d['amount'] or Decimal('0'),
                'new_count_30d': new_investments_30d['count'] or 0,
                'total_expected_returns': total_returns['expected'] or Decimal('0'),
                'total_actual_returns': total_returns['actual'] or Decimal('0')
            },
            'leads': {
                'total': total_leads,
                'converted': converted_leads,
                'new_30d': new_leads_30d,
                'conversion_rate': round(conversion_rate, 2)
            }
        }

    @classmethod
    def get_executive_statistics(cls, executive=None):
        """
        Obtiene estadísticas por ejecutivo.

        Args:
            executive: Usuario ejecutivo específico (opcional)

        Returns:
            list: Lista de estadísticas por ejecutivo
        """
        from apps.users.models import User
        from apps.leads.models import Lead
        from apps.investments.models import Investment

        executives = User.objects.filter(role=User.Role.EXECUTIVE, is_active=True)

        if executive:
            executives = executives.filter(id=executive.id)

        stats = []

        for exec_user in executives:
            # Estadísticas de leads
            leads_data = Lead.objects.filter(assigned_to=exec_user).aggregate(
                total=Count('id'),
                converted=Count('id', filter=Q(status=Lead.Status.CONVERTED)),
                contacted=Count('id', filter=Q(status=Lead.Status.CONTACTED)),
                interested=Count('id', filter=Q(status=Lead.Status.INTERESTED)),
                new=Count('id', filter=Q(status=Lead.Status.NEW))
            )

            conversion_rate = (
                (leads_data['converted'] / leads_data['total'] * 100)
                if leads_data['total'] > 0 else 0
            )

            # Inversiones de usuarios asignados a este ejecutivo
            investments_data = Investment.objects.filter(
                user__assigned_executive=exec_user,
                status=Investment.Status.ACTIVE
            ).aggregate(
                total_amount=Sum('amount'),
                count=Count('id')
            )

            stats.append({
                'executive_id': str(exec_user.id),
                'executive_name': exec_user.get_full_name(),
                'executive_email': exec_user.email,
                'leads': {
                    'total': leads_data['total'],
                    'new': leads_data['new'],
                    'contacted': leads_data['contacted'],
                    'interested': leads_data['interested'],
                    'converted': leads_data['converted'],
                    'conversion_rate': round(conversion_rate, 2)
                },
                'investments': {
                    'total_amount': investments_data['total_amount'] or Decimal('0'),
                    'count': investments_data['count'] or 0
                }
            })

        return stats

    @classmethod
    def get_project_statistics(cls, project=None):
        """
        Obtiene estadísticas por proyecto.

        Args:
            project: Proyecto específico (opcional)

        Returns:
            list: Lista de estadísticas por proyecto
        """
        from apps.projects.models import Project
        from apps.investments.models import Investment
        from apps.reservations.models import Reservation

        projects = Project.objects.all()

        if project:
            projects = projects.filter(id=project.id)

        stats = []

        for proj in projects:
            investments_data = Investment.objects.filter(project=proj).aggregate(
                active_amount=Sum('amount', filter=Q(status=Investment.Status.ACTIVE)),
                active_count=Count('id', filter=Q(status=Investment.Status.ACTIVE)),
                pending_amount=Sum('amount', filter=Q(status=Investment.Status.PENDING_PAYMENT)),
                pending_count=Count('id', filter=Q(status=Investment.Status.PENDING_PAYMENT))
            )

            reservations_data = Reservation.objects.filter(project=proj).aggregate(
                pending_amount=Sum('amount', filter=Q(status=Reservation.Status.PENDING)),
                pending_count=Count('id', filter=Q(status=Reservation.Status.PENDING))
            )

            stats.append({
                'project_id': str(proj.id),
                'project_title': proj.title,
                'status': proj.status,
                'target_amount': proj.target_amount,
                'current_amount': proj.current_amount,
                'funding_progress': proj.funding_progress_percentage,
                'investments': {
                    'active_amount': investments_data['active_amount'] or Decimal('0'),
                    'active_count': investments_data['active_count'] or 0,
                    'pending_amount': investments_data['pending_amount'] or Decimal('0'),
                    'pending_count': investments_data['pending_count'] or 0
                },
                'reservations': {
                    'pending_amount': reservations_data['pending_amount'] or Decimal('0'),
                    'pending_count': reservations_data['pending_count'] or 0
                }
            })

        return stats

    @classmethod
    def get_lead_source_statistics(cls):
        """
        Obtiene estadísticas de leads por fuente.

        Returns:
            list: Lista de estadísticas por fuente
        """
        from apps.leads.models import Lead

        sources = Lead.objects.values('source').annotate(
            total=Count('id'),
            converted=Count('id', filter=Q(status=Lead.Status.CONVERTED))
        ).order_by('-total')

        stats = []
        for source in sources:
            conversion_rate = (
                (source['converted'] / source['total'] * 100)
                if source['total'] > 0 else 0
            )
            stats.append({
                'source': source['source'],
                'source_display': dict(Lead.Source.choices).get(source['source'], source['source']),
                'total': source['total'],
                'converted': source['converted'],
                'conversion_rate': round(conversion_rate, 2)
            })

        return stats
