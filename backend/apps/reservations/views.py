"""
Reservation views for SomosRentable API.
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Reservation
from .serializers import (
    ReservationSerializer,
    ReservationDetailSerializer,
    ReservationCreateSerializer,
    ReservationConvertSerializer,
)
from .services import ReservationService
from apps.projects.models import Project
from apps.investments.serializers import InvestmentSerializer


class ReservationCreateView(APIView):
    """
    Crear reserva (público, solo requiere email).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ReservationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            project = Project.objects.get(pk=serializer.validated_data['project_id'])
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            reservation = ReservationService.create_reservation(
                project=project,
                email=serializer.validated_data['email'],
                amount=serializer.validated_data['amount'],
                name=serializer.validated_data.get('name', ''),
                phone=serializer.validated_data.get('phone', '')
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Reserva creada exitosamente.',
            'reservation': ReservationSerializer(reservation).data
        }, status=status.HTTP_201_CREATED)


class ReservationByTokenView(generics.RetrieveAPIView):
    """
    Ver reserva por token (público).
    """
    serializer_class = ReservationDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'access_token'
    lookup_url_kwarg = 'token'
    queryset = Reservation.objects.select_related('project')


class MyReservationsView(generics.ListAPIView):
    """
    Listar mis reservas (inversionista).
    """
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ReservationService.get_pending_reservations_for_email(
            self.request.user.email
        )


class ReservationConvertView(APIView):
    """
    Convertir reserva a inversión (inversionista con KYC).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        reservation = ReservationService.get_reservation_by_token(token)

        if not reservation:
            return Response(
                {'error': 'Reserva no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            investment = ReservationService.convert_to_investment(
                reservation, request.user
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Reserva convertida a inversión exitosamente.',
            'investment': InvestmentSerializer(investment).data
        })


class ReservationCancelView(APIView):
    """
    Cancelar reserva.
    """
    permission_classes = [permissions.AllowAny]

    def delete(self, request, token):
        reservation = ReservationService.get_reservation_by_token(token)

        if not reservation:
            return Response(
                {'error': 'Reserva no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if reservation.status != Reservation.Status.PENDING:
            return Response(
                {'error': 'La reserva no puede ser cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ReservationService.cancel_reservation(reservation)

        return Response({'message': 'Reserva cancelada.'})
