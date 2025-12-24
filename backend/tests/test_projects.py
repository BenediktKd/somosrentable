"""
Tests for projects and reservations endpoints.
"""
import pytest
from decimal import Decimal
from rest_framework import status

from apps.projects.models import Project
from apps.reservations.models import Reservation
from apps.leads.models import Lead


@pytest.mark.django_db
class TestProjectList:
    """Tests for project listing."""

    def test_list_projects_public(self, api_client, project):
        """Test anyone can list public projects."""
        url = '/api/projects/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_list_projects_filters_by_status(self, api_client, project, funded_project):
        """Test filtering projects by status."""
        # Test funding filter
        url = '/api/projects/?status=funding'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # At least the 'project' fixture should match
        assert len(response.data['results']) >= 1

        # Test funded filter
        url = '/api/projects/?status=funded'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestProjectDetail:
    """Tests for project detail."""

    def test_get_project_by_slug(self, api_client, project):
        """Test getting project by slug."""
        url = f'/api/projects/{project.slug}/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == project.title
        assert response.data['slug'] == project.slug

    def test_get_nonexistent_project(self, api_client):
        """Test getting non-existent project returns 404."""
        url = '/api/projects/nonexistent-slug/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestCalculateReturn:
    """Tests for return calculation."""

    def test_calculate_return(self, api_client, project):
        """Test calculating investment return."""
        url = f'/api/projects/{project.slug}/calculate-return/'
        data = {'amount': 10000000}  # 10 million
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'total_return' in response.data
        assert 'final_amount' in response.data

        # 12% annual return on 10M = 1.2M
        expected_return = Decimal('1200000.00')
        assert Decimal(response.data['total_return']) == expected_return

    def test_calculate_return_below_minimum(self, api_client, project):
        """Test calculating return with amount below minimum fails."""
        url = f'/api/projects/{project.slug}/calculate-return/'
        data = {'amount': 100}  # Way below minimum
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestReservations:
    """Tests for reservation endpoints."""

    def test_create_reservation_public(self, api_client, project):
        """Test anyone can create a reservation (no auth required)."""
        url = '/api/reservations/'
        data = {
            'email': 'newreservation@test.com',
            'name': 'New Reserver',
            'project': str(project.id),
            'amount': 5000000,
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert 'access_token' in response.data

        # Check reservation was created
        reservation = Reservation.objects.get(email='newreservation@test.com')
        assert reservation.project == project
        assert reservation.amount == Decimal('5000000')

    def test_create_reservation_creates_lead(self, api_client, project, executive_user):
        """Test creating reservation also creates a lead."""
        url = '/api/reservations/'
        data = {
            'email': 'leadtest@test.com',
            'name': 'Lead Test',
            'project': str(project.id),
            'amount': 5000000,
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

        # Check lead was created
        lead = Lead.objects.get(email='leadtest@test.com')
        assert lead.source == Lead.Source.RESERVATION

    def test_create_reservation_below_minimum(self, api_client, project):
        """Test reservation below minimum investment fails."""
        url = '/api/reservations/'
        data = {
            'email': 'test@test.com',
            'name': 'Test',
            'project': str(project.id),
            'amount': 100,  # Below minimum
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_reservation_by_token(self, api_client, reservation):
        """Test getting reservation by access token."""
        url = f'/api/reservations/{reservation.access_token}/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == reservation.email

    def test_get_my_reservations_authenticated(self, auth_client, investor_user, project):
        """Test authenticated user can get their reservations."""
        # Create reservation with user's email
        Reservation.objects.create(
            email=investor_user.email,
            name='My Reservation',
            project=project,
            amount=Decimal('5000000'),
        )

        url = '/api/reservations/my/'
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_convert_reservation_requires_kyc(self, auth_client, reservation, investor_user):
        """Test converting reservation requires KYC verification."""
        # Update reservation email to match user
        reservation.email = investor_user.email
        reservation.save()

        url = f'/api/reservations/{reservation.access_token}/convert/'
        response = auth_client.post(url)

        # Should fail because investor_user is not KYC verified
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'kyc' in response.data.get('error', '').lower() or 'verificar' in response.data.get('error', '').lower()

    def test_convert_reservation_success(self, verified_client, reservation, verified_investor):
        """Test KYC-verified user can convert reservation to investment."""
        # Update reservation email to match verified user
        reservation.email = verified_investor.email
        reservation.save()

        url = f'/api/reservations/{reservation.access_token}/convert/'
        response = verified_client.post(url)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'investment' in response.data

        reservation.refresh_from_db()
        assert reservation.status == Reservation.Status.CONVERTED
        assert reservation.converted_investment is not None


@pytest.mark.django_db
class TestProjectAdmin:
    """Tests for admin project management."""

    def test_create_project_as_admin(self, admin_client):
        """Test admin can create projects."""
        url = '/api/projects/admin/list/'
        data = {
            'title': 'New Admin Project',
            'slug': 'new-admin-project',
            'short_description': 'A new project',
            'description': 'Full description',
            'location': 'Santiago',
            'target_amount': 100000000,
            'minimum_investment': 1000000,
            'annual_return_rate': 12.0,
            'duration_months': 12,
            'status': 'draft',
        }
        response = admin_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED

    def test_create_project_as_investor_forbidden(self, auth_client):
        """Test investor cannot create projects."""
        url = '/api/projects/admin/list/'
        data = {
            'title': 'Investor Project',
            'slug': 'investor-project',
            'short_description': 'Should fail',
            'description': 'Full description',
            'location': 'Santiago',
            'target_amount': 100000000,
            'minimum_investment': 1000000,
            'annual_return_rate': 12.0,
            'duration_months': 12,
        }
        response = auth_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
