"""
URL configuration for SomosRentable project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/auth/', include('apps.users.urls')),
    path('api/kyc/', include('apps.kyc.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/reservations/', include('apps.reservations.urls')),
    path('api/investments/', include('apps.investments.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/statistics/', include('apps.statistics.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
