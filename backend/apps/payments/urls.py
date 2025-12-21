"""
Payment URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    PaymentProofUploadView,
    PendingPaymentsView,
    PaymentProofDetailView,
    PaymentReviewView,
)

urlpatterns = [
    path('proof/', PaymentProofUploadView.as_view(), name='payment_upload'),
    path('pending/', PendingPaymentsView.as_view(), name='pending_payments'),
    path('<uuid:pk>/', PaymentProofDetailView.as_view(), name='payment_detail'),
    path('<uuid:pk>/review/', PaymentReviewView.as_view(), name='payment_review'),
]
