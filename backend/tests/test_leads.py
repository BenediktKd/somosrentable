"""
Tests for leads and webhook endpoints.
"""
import pytest
from rest_framework import status
from django.conf import settings

from apps.leads.models import Lead, LeadInteraction
from apps.users.models import User


@pytest.mark.django_db
class TestLeadList:
    """Tests for lead listing."""

    def test_list_leads_as_admin(self, admin_client, lead):
        """Test admin can list all leads."""
        url = '/api/leads/'
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data

    def test_list_leads_as_executive(self, executive_client, lead):
        """Test executive can list leads."""
        url = '/api/leads/'
        response = executive_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_list_leads_as_investor_forbidden(self, auth_client):
        """Test investor cannot list leads."""
        url = '/api/leads/'
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_my_leads(self, executive_client, lead, executive_user):
        """Test executive can list their assigned leads."""
        url = '/api/leads/my/'
        response = executive_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # The lead fixture is assigned to executive_user
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestLeadDetail:
    """Tests for lead detail."""

    def test_get_lead_detail(self, admin_client, lead):
        """Test getting lead details."""
        url = f'/api/leads/{lead.id}/'
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == lead.email

    def test_update_lead_status(self, executive_client, lead):
        """Test executive can update lead status."""
        url = f'/api/leads/{lead.id}/'
        data = {'status': 'contacted'}
        response = executive_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK

        lead.refresh_from_db()
        assert lead.status == Lead.Status.CONTACTED


@pytest.mark.django_db
class TestLeadAssignment:
    """Tests for lead assignment."""

    def test_assign_lead_to_executive(self, admin_client, lead, executive_user):
        """Test admin can assign lead to executive."""
        # Create another executive
        other_exec = User.objects.create_user(
            email='other@exec.com',
            password='pass123',
            role=User.Role.EXECUTIVE,
        )

        url = f'/api/leads/{lead.id}/assign/'
        data = {'executive_id': str(other_exec.id)}
        response = admin_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK

        lead.refresh_from_db()
        assert lead.assigned_to == other_exec


@pytest.mark.django_db
class TestLeadInteractions:
    """Tests for lead interactions."""

    def test_add_interaction(self, executive_client, lead):
        """Test adding interaction to lead."""
        url = f'/api/leads/{lead.id}/interactions/add/'
        data = {
            'interaction_type': 'call',
            'description': 'Called the lead to discuss investment options',
            'outcome': 'Interested, will follow up',
        }
        response = executive_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED

        interaction = LeadInteraction.objects.get(lead=lead)
        assert interaction.description == data['description']

    def test_list_lead_interactions(self, executive_client, lead):
        """Test listing lead interactions."""
        # Create an interaction
        LeadInteraction.objects.create(
            lead=lead,
            executive=lead.assigned_to,
            interaction_type=LeadInteraction.InteractionType.CALL,
            description='Test call',
        )

        url = f'/api/leads/{lead.id}/interactions/'
        response = executive_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestWebhook:
    """Tests for external webhook endpoint."""

    def test_webhook_creates_lead(self, api_client):
        """Test webhook creates a new lead."""
        url = '/api/leads/webhook/'
        data = {
            'email': 'webhook.lead@test.com',
            'name': 'Webhook Lead',
            'phone': '+56 9 1234 5678',
            'source': 'facebook_ads',
        }
        headers = {'HTTP_X_API_KEY': 'webhook-secret-key'}
        response = api_client.post(url, data, **headers)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'lead_id' in response.data

        lead = Lead.objects.get(email='webhook.lead@test.com')
        assert lead.source == Lead.Source.WEBHOOK
        assert lead.name == 'Webhook Lead'

    def test_webhook_duplicate_email_returns_conflict(self, api_client, lead):
        """Test webhook with existing email returns 409."""
        url = '/api/leads/webhook/'
        data = {
            'email': lead.email,  # Already exists
            'name': 'Duplicate',
            'source': 'google_ads',
        }
        headers = {'HTTP_X_API_KEY': 'webhook-secret-key'}
        response = api_client.post(url, data, **headers)

        assert response.status_code == status.HTTP_409_CONFLICT

    def test_webhook_without_api_key_forbidden(self, api_client):
        """Test webhook without API key is forbidden."""
        url = '/api/leads/webhook/'
        data = {
            'email': 'test@test.com',
            'name': 'Test',
            'source': 'facebook_ads',
        }
        response = api_client.post(url, data)

        # API returns 401 or 403 depending on implementation
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_webhook_wrong_api_key_forbidden(self, api_client):
        """Test webhook with wrong API key is forbidden."""
        url = '/api/leads/webhook/'
        data = {
            'email': 'test@test.com',
            'name': 'Test',
            'source': 'facebook_ads',
        }
        headers = {'HTTP_X_API_KEY': 'wrong-key'}
        response = api_client.post(url, data, **headers)

        # API returns 401 or 403 depending on implementation
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestLeadRoundRobin:
    """Tests for round-robin lead assignment."""

    def test_lead_assigned_to_executive_with_fewer_leads(self, api_client, admin_user):
        """Test new leads are assigned to executive with fewer active leads."""
        # Create two executives
        exec1 = User.objects.create_user(
            email='exec1@test.com',
            password='pass123',
            role=User.Role.EXECUTIVE,
            is_active=True,
        )
        exec2 = User.objects.create_user(
            email='exec2@test.com',
            password='pass123',
            role=User.Role.EXECUTIVE,
            is_active=True,
        )

        # Assign 2 leads to exec1
        Lead.objects.create(email='lead1@test.com', assigned_to=exec1, source=Lead.Source.WEBSITE)
        Lead.objects.create(email='lead2@test.com', assigned_to=exec1, source=Lead.Source.WEBSITE)

        # Assign 0 leads to exec2 (he should get the next one)

        # Create new lead via webhook
        url = '/api/leads/webhook/'
        data = {
            'email': 'newlead@test.com',
            'name': 'New Lead',
            'source': 'facebook_ads',
        }
        headers = {'HTTP_X_API_KEY': 'webhook-secret-key'}
        response = api_client.post(url, data, **headers)

        assert response.status_code == status.HTTP_201_CREATED

        new_lead = Lead.objects.get(email='newlead@test.com')
        # Should be assigned to exec2 (fewer leads)
        assert new_lead.assigned_to == exec2


@pytest.mark.django_db
class TestEmailUnification:
    """Tests for email unification across reservations, webhook, and registration."""

    def test_same_email_reservation_then_registration(self, api_client, project, executive_user):
        """Test user registering with email that has a reservation."""
        # First create a reservation
        res_url = '/api/reservations/'
        res_data = {
            'email': 'unified@test.com',
            'name': 'Unified User',
            'project': str(project.id),
            'amount': 5000000,
        }
        api_client.post(res_url, res_data)

        # Check lead was created
        lead = Lead.objects.get(email='unified@test.com')
        assert lead.source == Lead.Source.RESERVATION

        # Now register with same email
        reg_url = '/api/auth/register/'
        reg_data = {
            'email': 'unified@test.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'Unified',
            'last_name': 'User',
        }
        response = api_client.post(reg_url, reg_data)

        assert response.status_code == status.HTTP_201_CREATED

        # Lead should be linked to the new user
        lead.refresh_from_db()
        assert lead.converted_user is not None
        assert lead.converted_user.email == 'unified@test.com'
        assert lead.status == Lead.Status.CONVERTED
