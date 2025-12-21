"""
Lead URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    LeadListView,
    MyLeadsView,
    LeadDetailView,
    LeadAssignView,
    LeadInteractionCreateView,
    LeadInteractionListView,
    LeadWebhookView,
)

urlpatterns = [
    path('', LeadListView.as_view(), name='lead_list'),
    path('my/', MyLeadsView.as_view(), name='my_leads'),
    path('<uuid:pk>/', LeadDetailView.as_view(), name='lead_detail'),
    path('<uuid:pk>/assign/', LeadAssignView.as_view(), name='lead_assign'),
    path('<uuid:pk>/interactions/', LeadInteractionListView.as_view(), name='lead_interactions'),
    path('<uuid:pk>/interactions/add/', LeadInteractionCreateView.as_view(), name='lead_interaction_add'),

    # Webhook externo
    path('webhook/', LeadWebhookView.as_view(), name='lead_webhook'),
]
