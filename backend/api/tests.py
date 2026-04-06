from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, DashboardWidget, FinancialAccount, Transaction, UserProfile


class AuthApiTests(APITestCase):
	def test_register_creates_user_without_token(self):
		response = self.client.post(
			'/api/auth/register/',
			{
				'full_name': 'Juan Dela Cruz',
				'email': 'juan@example.com',
				'password': 'SinopSecurePass123!',
				'monthly_budget_goal': '25000',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(User.objects.filter(email='juan@example.com').exists())
		self.assertNotIn('token', response.data)
		self.assertEqual(
			response.data['message'],
			'Account created successfully. Please log in with your credentials.',
		)
		user = User.objects.get(email='juan@example.com')
		self.assertEqual(FinancialAccount.objects.filter(user=user).count(), 0)
		self.assertEqual(Category.objects.filter(user=user).count(), 0)
		self.assertEqual(Transaction.objects.filter(user=user).count(), 0)
		self.assertGreater(DashboardWidget.objects.filter(user=user).count(), 0)

	def test_login_returns_token_for_existing_user(self):
		user = User.objects.create_user(
			username='maria@example.com',
			email='maria@example.com',
			password='SinopSecurePass123!',
		)
		UserProfile.objects.create(user=user, full_name='Maria Santos', monthly_budget_goal='18000.00')

		response = self.client.post(
			'/api/auth/login/',
			{'email': 'maria@example.com', 'password': 'SinopSecurePass123!'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('token', response.data)
		self.assertEqual(FinancialAccount.objects.filter(user=user).count(), 0)
		self.assertEqual(Category.objects.filter(user=user).count(), 0)
		self.assertEqual(Transaction.objects.filter(user=user).count(), 0)
		self.assertGreater(DashboardWidget.objects.filter(user=user).count(), 0)

	def test_me_requires_token(self):
		response = self.client.get('/api/auth/me/')
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_me_patch_updates_profile(self):
		user = User.objects.create_user(
			username='pedro@example.com',
			email='pedro@example.com',
			password='SinopSecurePass123!',
		)
		UserProfile.objects.create(user=user, full_name='Pedro Cruz', monthly_budget_goal='12000.00')

		login_response = self.client.post(
			'/api/auth/login/',
			{'email': 'pedro@example.com', 'password': 'SinopSecurePass123!'},
			format='json',
		)
		token = login_response.data['token']
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

		response = self.client.patch(
			'/api/auth/me/',
			{'full_name': 'Pedro Dela Cruz', 'monthly_budget_goal': '15000'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		user.refresh_from_db()
		self.assertEqual(user.profile.full_name, 'Pedro Dela Cruz')
		self.assertEqual(str(user.profile.monthly_budget_goal), '15000.00')


class DashboardAccountTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='ana@example.com',
			email='ana@example.com',
			password='SinopSecurePass123!',
		)
		UserProfile.objects.create(user=self.user, full_name='Ana Reyes', monthly_budget_goal='10000.00')

		login_response = self.client.post(
			'/api/auth/login/',
			{'email': 'ana@example.com', 'password': 'SinopSecurePass123!'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_response.data['token']}")

	def test_accounts_endpoint_accepts_credit_type(self):
		response = self.client.post(
			'/api/accounts/',
			{
				'name': 'Credit Card',
				'account_type': 'credit',
				'balance': '2500',
				'currency': 'PHP',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['account_type'], 'credit')

	def test_dashboard_total_balance_subtracts_liabilities(self):
		FinancialAccount.objects.create(user=self.user, name='Main Wallet', account_type='wallet', balance='3500')
		FinancialAccount.objects.create(user=self.user, name='Emergency Savings', account_type='savings', balance='10000')
		FinancialAccount.objects.create(user=self.user, name='Credit Card', account_type='credit', balance='2000')
		FinancialAccount.objects.create(user=self.user, name='Loan Balance', account_type='loan', balance='500')

		response = self.client.get('/api/dashboard/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['summary']['total_balance'], '11000.00')


class TransactionBalanceTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username='transactions@example.com',
			email='transactions@example.com',
			password='SinopSecurePass123!',
		)
		UserProfile.objects.create(user=self.user, full_name='Transaction Tester', monthly_budget_goal='8000.00')
		self.wallet = FinancialAccount.objects.create(user=self.user, name='Wallet', account_type='wallet', balance='1500')
		self.savings = FinancialAccount.objects.create(user=self.user, name='Savings', account_type='savings', balance='300')
		self.expense_category = Category.objects.create(user=self.user, name='Food', category_type='expense')
		self.income_category = Category.objects.create(user=self.user, name='Salary', category_type='income')

		login_response = self.client.post(
			'/api/auth/login/',
			{'email': 'transactions@example.com', 'password': 'SinopSecurePass123!'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f"Token {login_response.data['token']}")

	def test_expense_transaction_reduces_account_balance(self):
		response = self.client.post(
			'/api/transactions/',
			{
				'account': self.wallet.id,
				'category': self.expense_category.id,
				'amount': '200',
				'transaction_type': 'expense',
				'transaction_date': '2026-04-05',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.wallet.refresh_from_db()
		self.assertEqual(str(self.wallet.balance), '1300.00')

	def test_income_transaction_increases_account_balance(self):
		response = self.client.post(
			'/api/transactions/',
			{
				'account': self.wallet.id,
				'category': self.income_category.id,
				'amount': '500',
				'transaction_type': 'income',
				'transaction_date': '2026-04-05',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.wallet.refresh_from_db()
		self.assertEqual(str(self.wallet.balance), '2000.00')

	def test_transfer_moves_balance_between_accounts(self):
		response = self.client.post(
			'/api/transactions/',
			{
				'account': self.wallet.id,
				'transfer_account': self.savings.id,
				'amount': '250',
				'transaction_type': 'transfer',
				'transaction_date': '2026-04-05',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.wallet.refresh_from_db()
		self.savings.refresh_from_db()
		self.assertEqual(str(self.wallet.balance), '1250.00')
		self.assertEqual(str(self.savings.balance), '550.00')

	def test_deleting_transaction_keeps_current_balance(self):
		create_response = self.client.post(
			'/api/transactions/',
			{
				'account': self.wallet.id,
				'category': self.expense_category.id,
				'amount': '100',
				'transaction_type': 'expense',
				'transaction_date': '2026-04-05',
			},
			format='json',
		)

		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		delete_response = self.client.delete(f"/api/transactions/{create_response.data['id']}/")

		self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
		self.wallet.refresh_from_db()
		self.assertEqual(str(self.wallet.balance), '1400.00')
