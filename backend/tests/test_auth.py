"""
Tests for authentication endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from apps.users.models import User


@pytest.mark.django_db
class TestRegistration:
    """Tests for user registration."""

    def test_register_investor_success(self, api_client):
        """Test successful investor registration."""
        url = '/api/auth/register/'
        data = {
            'email': 'new@investor.com',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'New',
            'last_name': 'Investor',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']

        user = User.objects.get(email='new@investor.com')
        assert user.role == User.Role.INVESTOR
        assert not user.is_kyc_verified

    def test_register_duplicate_email(self, api_client, investor_user):
        """Test registration with existing email fails."""
        url = '/api/auth/register/'
        data = {
            'email': investor_user.email,
            'password': 'securepass123',
            'password_confirm': 'securepass123',
            'first_name': 'Duplicate',
            'last_name': 'User',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, api_client):
        """Test registration with mismatched passwords fails."""
        url = '/api/auth/register/'
        data = {
            'email': 'test@test.com',
            'password': 'securepass123',
            'password_confirm': 'differentpass',
            'first_name': 'Test',
            'last_name': 'User',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    """Tests for user login."""

    def test_login_success(self, api_client, investor_user):
        """Test successful login returns tokens."""
        url = '/api/auth/login/'
        data = {
            'email': investor_user.email,
            'password': 'testpass123',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_wrong_password(self, api_client, investor_user):
        """Test login with wrong password fails."""
        url = '/api/auth/login/'
        data = {
            'email': investor_user.email,
            'password': 'wrongpassword',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email fails."""
        url = '/api/auth/login/'
        data = {
            'email': 'nonexistent@test.com',
            'password': 'anypassword',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoints."""

    def test_get_profile_authenticated(self, auth_client, investor_user):
        """Test getting own profile when authenticated."""
        url = '/api/auth/me/'
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == investor_user.email
        assert response.data['role'] == 'investor'

    def test_get_profile_unauthenticated(self, api_client):
        """Test getting profile without auth fails."""
        url = '/api/auth/me/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, auth_client, investor_user):
        """Test updating own profile."""
        url = '/api/auth/me/'
        data = {
            'first_name': 'Updated',
            'phone': '+56 9 9999 9999',
        }
        response = auth_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK

        investor_user.refresh_from_db()
        assert investor_user.first_name == 'Updated'
        assert investor_user.phone == '+56 9 9999 9999'
