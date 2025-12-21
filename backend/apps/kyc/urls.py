"""
KYC URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    KYCStatusView,
    KYCSubmitView,
    KYCSubmissionListView,
    KYCSubmissionDetailView,
    KYCReviewView,
)

urlpatterns = [
    # Inversionista
    path('status/', KYCStatusView.as_view(), name='kyc_status'),
    path('submit/', KYCSubmitView.as_view(), name='kyc_submit'),

    # Admin/Ejecutivo
    path('submissions/', KYCSubmissionListView.as_view(), name='kyc_list'),
    path('submissions/<uuid:pk>/', KYCSubmissionDetailView.as_view(), name='kyc_detail'),
    path('submissions/<uuid:pk>/review/', KYCReviewView.as_view(), name='kyc_review'),
]
