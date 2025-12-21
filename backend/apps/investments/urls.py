"""
Investment URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    InvestmentListView,
    InvestmentDetailView,
    InvestmentCreateView,
    InvestmentProjectionView,
)

urlpatterns = [
    path('', InvestmentListView.as_view(), name='investment_list'),
    path('create/', InvestmentCreateView.as_view(), name='investment_create'),
    path('<uuid:pk>/', InvestmentDetailView.as_view(), name='investment_detail'),
    path('<uuid:pk>/projection/', InvestmentProjectionView.as_view(), name='investment_projection'),
]
