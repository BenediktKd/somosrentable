"""
Project views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from decimal import Decimal

from .models import Project, ProjectImage
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer,
    ProjectImageSerializer,
    ReturnCalculationSerializer,
    ReturnProjectionSerializer,
)
from apps.users.views import IsAdmin


class ProjectListView(generics.ListAPIView):
    """
    Listar proyectos disponibles (público).
    """
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Project.objects.filter(
            status__in=[Project.Status.FUNDING, Project.Status.FUNDED, Project.Status.IN_PROGRESS]
        )

        # Filtros opcionales
        is_featured = self.request.query_params.get('featured')
        if is_featured == 'true':
            queryset = queryset.filter(is_featured=True)

        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset.order_by('-is_featured', '-created_at')


class ProjectDetailView(generics.RetrieveAPIView):
    """
    Ver detalle de proyecto (público).
    """
    serializer_class = ProjectDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    queryset = Project.objects.prefetch_related('images')


class ProjectCalculateReturnView(APIView):
    """
    Calcular rentabilidad para un monto de inversión.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        try:
            project = Project.objects.get(slug=slug)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReturnCalculationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']

        if amount < project.minimum_investment:
            return Response({
                'error': f'El monto mínimo de inversión es ${project.minimum_investment:,.0f}'
            }, status=status.HTTP_400_BAD_REQUEST)

        projection = project.calculate_return(amount)

        return Response(ReturnProjectionSerializer(projection).data)


# Admin views

class AdminProjectListView(generics.ListCreateAPIView):
    """
    Listar y crear proyectos (admin).
    """
    permission_classes = [IsAdmin]
    queryset = Project.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateUpdateSerializer
        return ProjectListSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Ver, actualizar y eliminar proyecto (admin).
    """
    permission_classes = [IsAdmin]
    queryset = Project.objects.prefetch_related('images')
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer


class ProjectImageUploadView(generics.CreateAPIView):
    """
    Subir imagen a proyecto (admin).
    """
    serializer_class = ProjectImageSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        slug = self.kwargs.get('slug')
        project = Project.objects.get(slug=slug)
        serializer.save(project=project)


class ProjectImageDeleteView(generics.DestroyAPIView):
    """
    Eliminar imagen de proyecto (admin).
    """
    permission_classes = [IsAdmin]
    queryset = ProjectImage.objects.all()
