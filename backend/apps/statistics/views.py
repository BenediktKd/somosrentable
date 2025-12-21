"""
Statistics views for SomosRentable API.
"""
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .services import StatisticsService
from apps.users.models import User
from apps.users.views import IsAdminOrExecutive, IsAdmin


class PlatformStatisticsView(APIView):
    """
    Estadísticas generales de la plataforma (admin).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = StatisticsService.get_platform_statistics()
        return Response(stats)


class ExecutiveStatisticsView(APIView):
    """
    Estadísticas por ejecutivo (admin).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = StatisticsService.get_executive_statistics()
        return Response(stats)


class ExecutiveDetailStatisticsView(APIView):
    """
    Estadísticas de un ejecutivo específico.
    """
    permission_classes = [IsAdminOrExecutive]

    def get(self, request, pk):
        try:
            executive = User.objects.get(pk=pk, role=User.Role.EXECUTIVE)
        except User.DoesNotExist:
            return Response({'error': 'Ejecutivo no encontrado.'}, status=404)

        # Ejecutivos solo pueden ver sus propias estadísticas
        if request.user.role == User.Role.EXECUTIVE and request.user.id != executive.id:
            return Response({'error': 'No autorizado.'}, status=403)

        stats = StatisticsService.get_executive_statistics(executive)
        return Response(stats[0] if stats else {})


class MyStatisticsView(APIView):
    """
    Mis estadísticas (ejecutivo).
    """
    permission_classes = [IsAdminOrExecutive]

    def get(self, request):
        if request.user.role != User.Role.EXECUTIVE:
            return Response({'error': 'Solo para ejecutivos.'}, status=403)

        stats = StatisticsService.get_executive_statistics(request.user)
        return Response(stats[0] if stats else {})


class ProjectStatisticsView(APIView):
    """
    Estadísticas por proyecto (admin).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = StatisticsService.get_project_statistics()
        return Response(stats)


class LeadSourceStatisticsView(APIView):
    """
    Estadísticas de leads por fuente (admin).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = StatisticsService.get_lead_source_statistics()
        return Response(stats)
