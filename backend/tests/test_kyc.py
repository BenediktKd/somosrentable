"""
Tests for KYC (Know Your Customer) endpoints.
"""
import pytest
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from apps.kyc.models import KYCSubmission


@pytest.mark.django_db
class TestKYCStatus:
    """Tests for KYC status endpoint."""

    def test_get_kyc_status_not_verified(self, auth_client, investor_user):
        """Test KYC status for non-verified user."""
        url = '/api/kyc/status/'
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_verified'] is False
        assert response.data['submission'] is None

    def test_get_kyc_status_verified(self, verified_client, verified_investor):
        """Test KYC status for verified user."""
        url = '/api/kyc/status/'
        response = verified_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_verified'] is True

    def test_get_kyc_status_unauthenticated(self, api_client):
        """Test KYC status requires authentication."""
        url = '/api/kyc/status/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestKYCSubmit:
    """Tests for KYC submission."""

    def test_submit_kyc_success(self, auth_client, investor_user):
        """Test successful KYC submission."""
        url = '/api/kyc/submit/'

        # Create a simple test image
        image = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'\x47\x49\x46\x38\x89\x61',  # GIF header bytes
            content_type='image/jpeg'
        )

        data = {
            'full_name': 'Test Investor Full Name',
            'document_number': '12345678-9',
            'document_photo': image,
        }
        response = auth_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED

        submission = KYCSubmission.objects.get(user=investor_user)
        assert submission.full_name == 'Test Investor Full Name'
        assert submission.status in [
            KYCSubmission.Status.APPROVED,
            KYCSubmission.Status.REJECTED
        ]

    def test_submit_kyc_already_verified(self, verified_client, verified_investor):
        """Test KYC submission when already verified fails."""
        url = '/api/kyc/submit/'

        image = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'\x47\x49\x46\x38\x89\x61',
            content_type='image/jpeg'
        )

        data = {
            'full_name': 'Already Verified',
            'document_number': '12345678-9',
            'document_photo': image,
        }
        response = verified_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestKYCApprovalRate:
    """Tests for KYC 80/20 approval rate."""

    @patch('apps.kyc.services.random.random')
    def test_kyc_approved_when_random_below_threshold(self, mock_random, auth_client, investor_user):
        """Test KYC is approved when random < 0.8."""
        mock_random.return_value = 0.5  # Below 0.8 threshold

        url = '/api/kyc/submit/'
        image = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'\x47\x49\x46\x38\x89\x61',
            content_type='image/jpeg'
        )

        data = {
            'full_name': 'Should Be Approved',
            'document_number': '12345678-9',
            'document_photo': image,
        }
        response = auth_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED

        investor_user.refresh_from_db()
        assert investor_user.is_kyc_verified is True

        submission = KYCSubmission.objects.get(user=investor_user)
        assert submission.status == KYCSubmission.Status.APPROVED

    @patch('apps.kyc.services.random.random')
    def test_kyc_rejected_when_random_above_threshold(self, mock_random, auth_client, investor_user):
        """Test KYC is rejected when random >= 0.8."""
        mock_random.return_value = 0.9  # Above 0.8 threshold

        url = '/api/kyc/submit/'
        image = SimpleUploadedFile(
            name='test_doc.jpg',
            content=b'\x47\x49\x46\x38\x89\x61',
            content_type='image/jpeg'
        )

        data = {
            'full_name': 'Should Be Rejected',
            'document_number': '12345678-9',
            'document_photo': image,
        }
        response = auth_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED

        investor_user.refresh_from_db()
        assert investor_user.is_kyc_verified is False

        submission = KYCSubmission.objects.get(user=investor_user)
        assert submission.status == KYCSubmission.Status.REJECTED
        assert submission.rejection_reason != ''


@pytest.mark.django_db
class TestKYCAdminReview:
    """Tests for admin KYC review."""

    def test_list_pending_kyc_as_admin(self, admin_client, investor_user):
        """Test admin can list pending KYC submissions."""
        # Create a pending submission
        KYCSubmission.objects.create(
            user=investor_user,
            full_name='Pending User',
            document_number='12345678-9',
            status=KYCSubmission.Status.PENDING,
        )

        url = '/api/kyc/submissions/'
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_list_pending_kyc_as_investor_forbidden(self, auth_client):
        """Test investor cannot list KYC submissions."""
        url = '/api/kyc/submissions/'
        response = auth_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
