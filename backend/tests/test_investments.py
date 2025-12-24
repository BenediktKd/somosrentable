"""
Tests for investments and payments endpoints.
"""
import pytest
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from apps.investments.models import Investment
from apps.payments.models import PaymentProof


@pytest.mark.django_db
class TestInvestmentCreate:
    """Tests for creating investments."""

    def test_create_investment_verified_investor(self, verified_client, project, verified_investor):
        """Test KYC-verified investor can create investment."""
        url = '/api/investments/create/'
        data = {
            'project': str(project.id),
            'amount': 5000000,
        }
        response = verified_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED

        investment = Investment.objects.get(user=verified_investor, project=project)
        assert investment.amount == Decimal('5000000')
        assert investment.status == Investment.Status.PENDING_PAYMENT
        # Check snapshot was captured
        assert investment.annual_return_rate_snapshot == project.annual_return_rate
        assert investment.duration_months_snapshot == project.duration_months

    def test_create_investment_unverified_forbidden(self, auth_client, project):
        """Test non-KYC investor cannot create investment."""
        url = '/api/investments/create/'
        data = {
            'project': str(project.id),
            'amount': 5000000,
        }
        response = auth_client.post(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_investment_below_minimum(self, verified_client, project):
        """Test investment below minimum fails."""
        url = '/api/investments/create/'
        data = {
            'project': str(project.id),
            'amount': 100,  # Below minimum
        }
        response = verified_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_investment_funded_project_fails(self, verified_client, funded_project):
        """Test cannot invest in fully funded project."""
        url = '/api/investments/create/'
        data = {
            'project': str(funded_project.id),
            'amount': 5000000,
        }
        response = verified_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestInvestmentList:
    """Tests for listing investments."""

    def test_list_my_investments(self, verified_client, investment):
        """Test user can list their investments."""
        url = '/api/investments/'
        response = verified_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_list_investments_unauthenticated(self, api_client):
        """Test listing investments requires authentication."""
        url = '/api/investments/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestInvestmentProjection:
    """Tests for investment return projection."""

    def test_get_investment_projection(self, verified_client, investment):
        """Test getting investment return projection."""
        url = f'/api/investments/{investment.id}/projection/'
        response = verified_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'projections' in response.data
        assert len(response.data['projections']) == 12  # 12 months


@pytest.mark.django_db
class TestPaymentProof:
    """Tests for payment proof upload."""

    def test_upload_payment_proof(self, verified_client, investment):
        """Test uploading payment proof."""
        url = '/api/payments/proof/'

        image = SimpleUploadedFile(
            name='proof.jpg',
            content=b'\x47\x49\x46\x38\x89\x61',
            content_type='image/jpeg'
        )

        data = {
            'investment_id': str(investment.id),
            'proof_image': image,
            'amount': 5000000,
            'bank_name': 'Banco Test',
            'transaction_reference': 'TX123456',
            'transaction_date': '2024-01-15',
        }
        response = verified_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED

        investment.refresh_from_db()
        assert investment.status == Investment.Status.PAYMENT_REVIEW

        proof = PaymentProof.objects.get(investment=investment)
        assert proof.status == PaymentProof.Status.PENDING

    def test_upload_payment_proof_wrong_investment(self, verified_client, investment, investor_user):
        """Test cannot upload proof for another user's investment."""
        # investment belongs to verified_investor, not investor_user
        from tests.conftest import api_client as make_client
        other_client = verified_client

        # Create investment for different user
        other_investment = Investment.objects.create(
            user=investor_user,
            project=investment.project,
            amount=Decimal('1000000'),
            status=Investment.Status.PENDING_PAYMENT,
        )

        url = '/api/payments/proof/'
        image = SimpleUploadedFile(
            name='proof.jpg',
            content=b'\x47\x49\x46\x38\x89\x61',
            content_type='image/jpeg'
        )

        data = {
            'investment_id': str(other_investment.id),
            'proof_image': image,
            'amount': 1000000,
            'bank_name': 'Banco Test',
            'transaction_reference': 'TX123456',
            'transaction_date': '2024-01-15',
        }
        response = verified_client.post(url, data, format='multipart')

        # Should fail - not their investment
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
class TestPaymentReview:
    """Tests for admin payment review."""

    def test_list_pending_payments(self, admin_client, investment):
        """Test admin can list pending payments."""
        # Create a payment proof
        PaymentProof.objects.create(
            investment=investment,
            amount=Decimal('5000000'),
            bank_name='Test Bank',
            transaction_reference='TX123',
            transaction_date='2024-01-15',
            status=PaymentProof.Status.PENDING,
        )

        url = '/api/payments/pending/'
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_200_OK

    def test_approve_payment(self, admin_client, investment):
        """Test admin can approve payment."""
        proof = PaymentProof.objects.create(
            investment=investment,
            amount=Decimal('5000000'),
            bank_name='Test Bank',
            transaction_reference='TX123',
            transaction_date='2024-01-15',
            status=PaymentProof.Status.PENDING,
        )
        investment.status = Investment.Status.PAYMENT_REVIEW
        investment.save()

        url = f'/api/payments/{proof.id}/review/'
        data = {'action': 'approve'}
        response = admin_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK

        proof.refresh_from_db()
        investment.refresh_from_db()

        assert proof.status == PaymentProof.Status.APPROVED
        assert investment.status == Investment.Status.ACTIVE

    def test_reject_payment_requires_reason(self, admin_client, investment):
        """Test rejecting payment requires a reason."""
        proof = PaymentProof.objects.create(
            investment=investment,
            amount=Decimal('5000000'),
            bank_name='Test Bank',
            transaction_reference='TX123',
            transaction_date='2024-01-15',
            status=PaymentProof.Status.PENDING,
        )

        url = f'/api/payments/{proof.id}/review/'
        data = {'action': 'reject'}  # No reason provided
        response = admin_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_reject_payment_with_reason(self, admin_client, investment):
        """Test admin can reject payment with reason."""
        proof = PaymentProof.objects.create(
            investment=investment,
            amount=Decimal('5000000'),
            bank_name='Test Bank',
            transaction_reference='TX123',
            transaction_date='2024-01-15',
            status=PaymentProof.Status.PENDING,
        )
        investment.status = Investment.Status.PAYMENT_REVIEW
        investment.save()

        url = f'/api/payments/{proof.id}/review/'
        data = {
            'action': 'reject',
            'rejection_reason': 'Comprobante borroso',
        }
        response = admin_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK

        proof.refresh_from_db()
        investment.refresh_from_db()

        assert proof.status == PaymentProof.Status.REJECTED
        assert proof.rejection_reason == 'Comprobante borroso'
        assert investment.status == Investment.Status.PENDING_PAYMENT

    def test_investor_cannot_review_payments(self, auth_client, investment):
        """Test investor cannot review payments."""
        proof = PaymentProof.objects.create(
            investment=investment,
            amount=Decimal('5000000'),
            bank_name='Test Bank',
            transaction_reference='TX123',
            transaction_date='2024-01-15',
            status=PaymentProof.Status.PENDING,
        )

        url = f'/api/payments/{proof.id}/review/'
        data = {'action': 'approve'}
        response = auth_client.post(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN
