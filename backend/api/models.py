from django.conf import settings
from django.db import models


class UserProfile(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
	full_name = models.CharField(max_length=255)
	monthly_budget_goal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.full_name or self.user.email or self.user.username


class UserSettings(models.Model):
	CURRENCY_CHOICES = [
		('PHP', 'Philippine Peso'),
		('USD', 'US Dollar'),
		('EUR', 'Euro'),
	]

	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings')
	dark_mode = models.BooleanField(default=False)
	currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='PHP')
	locale = models.CharField(max_length=20, default='en-PH')
	two_factor_enabled = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f'{self.user.username} settings'


class FinancialAccount(models.Model):
	ACCOUNT_TYPE_CHOICES = [
		('wallet', 'Wallet'),
		('savings', 'Savings'),
		('credit', 'Credit'),
		('loan', 'Loans'),
		('bank', 'Bank Account'),
		('ewallet', 'E-Wallet'),
		('cash', 'Cash'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='financial_accounts')
	name = models.CharField(max_length=255)
	account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
	balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	currency = models.CharField(max_length=3, default='PHP')
	institution = models.CharField(max_length=255, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['name']

	def __str__(self):
		return self.name


class Category(models.Model):
	CATEGORY_TYPE_CHOICES = [
		('income', 'Income'),
		('expense', 'Expense'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories', null=True, blank=True)
	name = models.CharField(max_length=255)
	category_type = models.CharField(max_length=20, choices=CATEGORY_TYPE_CHOICES, default='expense')
	color = models.CharField(max_length=20, default='#22d3ee')
	icon = models.CharField(max_length=50, default='wallet')
	is_default = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['name']
		unique_together = [('user', 'name', 'category_type')]

	def __str__(self):
		return self.name


class RecurringTransaction(models.Model):
	FREQUENCY_CHOICES = [
		('weekly', 'Weekly'),
		('monthly', 'Monthly'),
	]
	TRANSACTION_TYPE_CHOICES = [
		('income', 'Income'),
		('expense', 'Expense'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recurring_transactions')
	account = models.ForeignKey(FinancialAccount, on_delete=models.CASCADE, related_name='recurring_transactions')
	category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='recurring_transactions')
	title = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
	frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
	start_date = models.DateField()
	next_run_date = models.DateField()
	notes = models.TextField(blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['next_run_date', 'title']

	def __str__(self):
		return self.title


class Transaction(models.Model):
	TRANSACTION_TYPE_CHOICES = [
		('income', 'Income'),
		('expense', 'Expense'),
		('transfer', 'Transfer'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
	account = models.ForeignKey(FinancialAccount, on_delete=models.CASCADE, related_name='transactions')
	transfer_account = models.ForeignKey(
		FinancialAccount,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='incoming_transfers',
	)
	category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
	recurring_template = models.ForeignKey(
		RecurringTransaction,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='generated_transactions',
	)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
	transaction_date = models.DateField()
	notes = models.TextField(blank=True)
	is_auto_generated = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-transaction_date', '-created_at']

	def __str__(self):
		return f'{self.transaction_type} {self.amount}'


class Budget(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets')
	category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
	month = models.DateField()
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	alert_threshold = models.PositiveSmallIntegerField(default=80)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-month', 'category__name']
		unique_together = [('user', 'category', 'month')]

	def __str__(self):
		return f'{self.category.name} budget'


class IncomeSource(models.Model):
	FREQUENCY_CHOICES = [
		('weekly', 'Weekly'),
		('biweekly', 'Biweekly'),
		('monthly', 'Monthly'),
		('custom', 'Custom'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='income_sources')
	account = models.ForeignKey(FinancialAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='income_sources')
	name = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
	next_payment_date = models.DateField(null=True, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['name']

	def __str__(self):
		return self.name


class BillReminder(models.Model):
	FREQUENCY_CHOICES = [
		('weekly', 'Weekly'),
		('monthly', 'Monthly'),
		('yearly', 'Yearly'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bill_reminders')
	account = models.ForeignKey(FinancialAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='bill_reminders')
	category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='bill_reminders')
	title = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	due_date = models.DateField()
	frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
	reminder_days_before = models.PositiveSmallIntegerField(default=3)
	is_paid = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['due_date', 'title']

	def __str__(self):
		return self.title


class SavingsGoal(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='savings_goals')
	name = models.CharField(max_length=255)
	target_amount = models.DecimalField(max_digits=12, decimal_places=2)
	current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	target_date = models.DateField(null=True, blank=True)
	color = models.CharField(max_length=20, default='#14b8a6')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['target_date', 'name']

	def __str__(self):
		return self.name


class Notification(models.Model):
	NOTIFICATION_TYPE_CHOICES = [
		('budget', 'Budget Alert'),
		('bill', 'Bill Reminder'),
		('spending', 'Unusual Spending'),
		('goal', 'Goal Update'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
	title = models.CharField(max_length=255)
	message = models.TextField()
	notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
	is_read = models.BooleanField(default=False)
	scheduled_for = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return self.title


class DashboardWidget(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_widgets')
	key = models.CharField(max_length=100)
	title = models.CharField(max_length=255)
	is_visible = models.BooleanField(default=True)
	display_order = models.PositiveSmallIntegerField(default=0)

	class Meta:
		ordering = ['display_order', 'title']
		unique_together = [('user', 'key')]

	def __str__(self):
		return self.title
