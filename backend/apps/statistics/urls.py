"""
Statistics URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    PlatformStatisticsView,
    ExecutiveStatisticsView,
    ExecutiveDetailStatisticsView,
    MyStatisticsView,
    ProjectStatisticsView,
    LeadSourceStatisticsView,
)

urlpatterns = [
    path('platform/', PlatformStatisticsView.as_view(), name='platform_stats'),
    path('executives/', ExecutiveStatisticsView.as_view(), name='executive_stats'),
    path('executives/<uuid:pk>/', ExecutiveDetailStatisticsView.as_view(), name='executive_detail_stats'),
    path('my/', MyStatisticsView.as_view(), name='my_stats'),
    path('projects/', ProjectStatisticsView.as_view(), name='project_stats'),
    path('lead-sources/', LeadSourceStatisticsView.as_view(), name='lead_source_stats'),
]
