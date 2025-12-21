"""
Reservation URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    ReservationCreateView,
    ReservationByTokenView,
    MyReservationsView,
    ReservationConvertView,
    ReservationCancelView,
)

urlpatterns = [
    path('', ReservationCreateView.as_view(), name='reservation_create'),
    path('my/', MyReservationsView.as_view(), name='my_reservations'),
    path('<str:token>/', ReservationByTokenView.as_view(), name='reservation_by_token'),
    path('<str:token>/convert/', ReservationConvertView.as_view(), name='reservation_convert'),
    path('<str:token>/cancel/', ReservationCancelView.as_view(), name='reservation_cancel'),
]
