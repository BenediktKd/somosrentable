"""
Pytest fixtures for SomosRentable tests.
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.users.models import User
from apps.projects.models import Project
from apps.leads.models import Lead
from apps.reservations.models import Reservation
from apps.investments.models import Investment
from apps.kyc.models import KYCSubmission


@pytest.fixture
def api_client():
    """Return an API client for testing."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_user(
        email='admin@test.com',
        password='testpass123',
        first_name='Admin',
        last_name='Test',
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
        is_kyc_verified=True,
    )


@pytest.fixture
def executive_user(db):
    """Create an executive user."""
    return User.objects.create_user(
        email='executive@test.com',
        password='testpass123',
        first_name='Executive',
        last_name='Test',
        role=User.Role.EXECUTIVE,
        is_staff=True,
        is_kyc_verified=True,
    )


@pytest.fixture
def investor_user(db):
    """Create an investor user (not KYC verified)."""
    return User.objects.create_user(
        email='investor@test.com',
        password='testpass123',
        first_name='Investor',
        last_name='Test',
        role=User.Role.INVESTOR,
        is_kyc_verified=False,
    )


@pytest.fixture
def verified_investor(db):
    """Create a KYC-verified investor."""
    return User.objects.create_user(
        email='verified@test.com',
        password='testpass123',
        first_name='Verified',
        last_name='Investor',
        role=User.Role.INVESTOR,
        is_kyc_verified=True,
    )


@pytest.fixture
def project(db, admin_user):
    """Create a test project."""
    return Project.objects.create(
        title='Test Project',
        slug='test-project',
        short_description='A test project for testing',
        description='Full description of the test project',
        location='Santiago, Chile',
        target_amount=Decimal('100000000'),
        minimum_investment=Decimal('1000000'),
        current_amount=Decimal('0'),
        annual_return_rate=Decimal('12.00'),
        duration_months=12,
        status=Project.Status.FUNDING,
        created_by=admin_user,
        funding_start_date=timezone.now().date(),
        funding_end_date=timezone.now().date() + timedelta(days=90),
    )


@pytest.fixture
def funded_project(db, admin_user):
    """Create a fully funded project."""
    return Project.objects.create(
        title='Funded Project',
        slug='funded-project',
        short_description='A fully funded project',
        description='This project has reached its funding goal',
        location='Valparaiso, Chile',
        target_amount=Decimal('50000000'),
        minimum_investment=Decimal('500000'),
        current_amount=Decimal('50000000'),
        annual_return_rate=Decimal('10.00'),
        duration_months=12,
        status=Project.Status.FUNDED,
        created_by=admin_user,
        funding_start_date=timezone.now().date() - timedelta(days=30),
        funding_end_date=timezone.now().date() + timedelta(days=60),
    )


@pytest.fixture
def reservation(db, project):
    """Create a test reservation."""
    return Reservation.objects.create(
        email='reservation@test.com',
        name='Test Reservation',
        project=project,
        amount=Decimal('5000000'),
    )


@pytest.fixture
def lead(db, executive_user):
    """Create a test lead."""
    return Lead.objects.create(
        email='lead@test.com',
        name='Test Lead',
        phone='+56 9 1234 5678',
        source=Lead.Source.WEBSITE,
        assigned_to=executive_user,
    )


@pytest.fixture
def investment(db, verified_investor, project):
    """Create a test investment."""
    inv = Investment(
        user=verified_investor,
        project=project,
        amount=Decimal('5000000'),
        status=Investment.Status.PENDING_PAYMENT,
    )
    # Set snapshots manually to avoid save() calculation issues
    inv.annual_return_rate_snapshot = project.annual_return_rate
    inv.duration_months_snapshot = project.duration_months
    inv.save()
    return inv


@pytest.fixture
def auth_client(api_client, investor_user):
    """Return an authenticated API client for investor."""
    api_client.force_authenticate(user=investor_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an authenticated API client for admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def executive_client(api_client, executive_user):
    """Return an authenticated API client for executive."""
    api_client.force_authenticate(user=executive_user)
    return api_client


@pytest.fixture
def verified_client(api_client, verified_investor):
    """Return an authenticated API client for verified investor."""
    api_client.force_authenticate(user=verified_investor)
    return api_client
