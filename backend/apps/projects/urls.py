"""
Project URLs for SomosRentable API.
"""
from django.urls import path

from .views import (
    ProjectListView,
    ProjectDetailView,
    ProjectCalculateReturnView,
    AdminProjectListView,
    AdminProjectDetailView,
    ProjectImageUploadView,
    ProjectImageDeleteView,
)

urlpatterns = [
    # Público
    path('', ProjectListView.as_view(), name='project_list'),
    path('<slug:slug>/', ProjectDetailView.as_view(), name='project_detail'),
    path('<slug:slug>/calculate-return/', ProjectCalculateReturnView.as_view(), name='project_calculate_return'),

    # Admin
    path('admin/list/', AdminProjectListView.as_view(), name='admin_project_list'),
    path('admin/<slug:slug>/', AdminProjectDetailView.as_view(), name='admin_project_detail'),
    path('<slug:slug>/images/', ProjectImageUploadView.as_view(), name='project_image_upload'),
    path('<slug:slug>/images/<uuid:pk>/', ProjectImageDeleteView.as_view(), name='project_image_delete'),
]
