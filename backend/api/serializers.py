from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction as db_transaction
from rest_framework import serializers

from .models import (
    BillReminder,
    Budget,
    Category,
    DashboardWidget,
    FinancialAccount,
    Feedback,
    IncomeSource,
    Notification,
    RecurringTransaction,
    SavingsGoal,
    SecurityLog,
    Transaction,
    UserProfile,
    UserSettings,
)
from .services import bootstrap_user_data, ensure_profile

User = get_user_model()


def get_user_profile(user):
    try:
        return user.profile
    except UserProfile.DoesNotExist:
        return None


def get_user_settings(user):
    try:
        return user.settings
    except UserSettings.DoesNotExist:
        return None


def parse_decimal_value(value, field_name):
    if value in (None, ''):
        return None

    if isinstance(value, Decimal):
        return value

    cleaned = ''.join(character for character in str(value) if character.isdigit() or character == '.')
    if not cleaned:
        return None

    try:
        return Decimal(cleaned)
    except InvalidOperation as error:
        raise serializers.ValidationError(f'Enter a valid {field_name}.') from error


def parse_budget_goal(value):
    return parse_decimal_value(value, 'monthly budget goal')


def is_liability_account(account):
    return account.account_type in {'credit', 'loan'}


def apply_account_flow(account, amount, direction):
    amount = Decimal(amount)
    multiplier = Decimal('-1') if is_liability_account(account) else Decimal('1')

    if direction == 'outflow':
        multiplier *= Decimal('-1')

    account.balance = Decimal(account.balance) + (amount * multiplier)
    account.save(update_fields=['balance', 'updated_at'])


def apply_transaction_effect(instance):
    if instance.transaction_type == 'income':
        apply_account_flow(instance.account, instance.amount, 'inflow')
        return

    if instance.transaction_type == 'expense':
        apply_account_flow(instance.account, instance.amount, 'outflow')
        return

    if instance.transaction_type == 'transfer':
        apply_account_flow(instance.account, instance.amount, 'outflow')
        apply_account_flow(instance.transfer_account, instance.amount, 'inflow')


def reverse_transaction_effect(instance):
    if instance.transaction_type == 'income':
        apply_account_flow(instance.account, instance.amount, 'outflow')
        return

    if instance.transaction_type == 'expense':
        apply_account_flow(instance.account, instance.amount, 'inflow')
        return

    if instance.transaction_type == 'transfer':
        apply_account_flow(instance.account, instance.amount, 'inflow')
        apply_account_flow(instance.transfer_account, instance.amount, 'outflow')


class UserSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField()
    full_name = serializers.SerializerMethodField()
    monthly_budget_goal = serializers.SerializerMethodField()
    settings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'monthly_budget_goal', 'settings', 'is_staff', 'date_joined']

    def get_full_name(self, user):
        profile = get_user_profile(user)
        return profile.full_name if profile else ''

    def get_monthly_budget_goal(self, user):
        profile = get_user_profile(user)
        budget_goal = profile.monthly_budget_goal if profile else None
        return str(budget_goal) if budget_goal is not None else None

    def get_settings(self, user):
        settings = get_user_settings(user)
        if not settings:
            return None
        return UserSettingsSerializer(settings).data


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    monthly_budget_goal = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return normalized_email

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_monthly_budget_goal(self, value):
        return parse_budget_goal(value)

    def create(self, validated_data):
        full_name = validated_data['full_name'].strip()
        email = validated_data['email']
        password = validated_data['password']
        monthly_budget_goal = validated_data.get('monthly_budget_goal')

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            is_staff=email.lower() == getattr(settings, 'DEFAULT_ADMIN_EMAIL', 'admin@sinop.local').lower(),
        )
        profile = bootstrap_user_data(user, full_name)
        profile.monthly_budget_goal = monthly_budget_goal
        profile.save(update_fields=['monthly_budget_goal', 'updated_at'])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return value.strip().lower()


class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=False)
    monthly_budget_goal = serializers.CharField(required=False, allow_blank=True)

    def validate_monthly_budget_goal(self, value):
        return parse_budget_goal(value)

    def update(self, instance, validated_data):
        profile = ensure_profile(instance, validated_data.get('full_name', ''))

        if 'full_name' in validated_data:
            profile.full_name = validated_data['full_name'].strip()

        if 'monthly_budget_goal' in validated_data:
            profile.monthly_budget_goal = validated_data['monthly_budget_goal']

        profile.save(update_fields=['full_name', 'monthly_budget_goal', 'updated_at'])
        return instance


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['dark_mode', 'currency', 'locale', 'two_factor_enabled']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = ['id', 'key', 'title', 'is_visible', 'display_order']


class FinancialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialAccount
        fields = [
            'id',
            'name',
            'account_type',
            'balance',
            'currency',
            'institution',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'category_type', 'color', 'icon', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['is_default', 'created_at', 'updated_at']


class RecurringTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringTransaction
        fields = [
            'id',
            'account',
            'category',
            'title',
            'amount',
            'transaction_type',
            'frequency',
            'start_date',
            'next_run_date',
            'notes',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    transfer_account_name = serializers.CharField(source='transfer_account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'account',
            'account_name',
            'transfer_account',
            'transfer_account_name',
            'category',
            'category_name',
            'category_color',
            'recurring_template',
            'amount',
            'transaction_type',
            'transaction_date',
            'notes',
            'is_auto_generated',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['is_auto_generated', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        instance = getattr(self, 'instance', None)

        account = attrs.get('account', getattr(instance, 'account', None))
        transfer_account = attrs.get('transfer_account', getattr(instance, 'transfer_account', None))
        category = attrs.get('category', getattr(instance, 'category', None))
        transaction_type = attrs.get('transaction_type', getattr(instance, 'transaction_type', None))

        if account and user and account.user_id != user.id:
            raise serializers.ValidationError({'account': 'You can only use your own account.'})

        if transfer_account and user and transfer_account.user_id != user.id:
            raise serializers.ValidationError({'transfer_account': 'You can only transfer to your own account.'})

        if category and getattr(category, 'user_id', None) not in (None, user.id if user else None):
            raise serializers.ValidationError({'category': 'You can only use your own category.'})

        if transaction_type == 'transfer':
            if not transfer_account:
                raise serializers.ValidationError({'transfer_account': 'Select a destination account for transfers.'})

            if account and transfer_account and account.id == transfer_account.id:
                raise serializers.ValidationError({'transfer_account': 'Source and destination accounts must be different.'})

            attrs['category'] = None
        else:
            attrs['transfer_account'] = None

        return attrs

    @db_transaction.atomic
    def create(self, validated_data):
        instance = super().create(validated_data)
        apply_transaction_effect(instance)
        return instance

    @db_transaction.atomic
    def update(self, instance, validated_data):
        reverse_transaction_effect(instance)

        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)

        instance.save()
        apply_transaction_effect(instance)
        return instance


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id',
            'category',
            'category_name',
            'category_color',
            'month',
            'amount',
            'alert_threshold',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class IncomeSourceSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = IncomeSource
        fields = [
            'id',
            'name',
            'account',
            'account_name',
            'amount',
            'frequency',
            'next_payment_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class BillReminderSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BillReminder
        fields = [
            'id',
            'title',
            'amount',
            'account',
            'account_name',
            'category',
            'category_name',
            'due_date',
            'frequency',
            'reminder_days_before',
            'is_paid',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SavingsGoal
        fields = [
            'id',
            'name',
            'target_amount',
            'current_amount',
            'target_date',
            'color',
            'progress_percentage',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_progress_percentage(self, goal):
        if not goal.target_amount:
            return 0
        return min(round((goal.current_amount / goal.target_amount) * 100, 2), 100)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'scheduled_for', 'created_at']
        read_only_fields = ['created_at']

from django.db.models import Count

class AdminTransactionSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    type = serializers.CharField(source='transaction_type', read_only=True)
    category = serializers.SerializerMethodField()
    date = serializers.DateField(source='transaction_date', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'type', 'category', 'amount', 'date']

    def get_user(self, obj):
        return obj.user.profile.full_name if hasattr(obj.user, 'profile') and obj.user.profile.full_name else obj.user.email

    def get_category(self, obj):
        return obj.category.name if obj.category else 'Uncategorized'


class AdminCategorySerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'total']

    def get_total(self, obj):
        return obj.transactions.count()


class AdminBudgetSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    limit = serializers.DecimalField(source='amount', max_digits=12, decimal_places=2, read_only=True)
    spent = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = ['id', 'category', 'limit', 'spent']

    def get_spent(self, obj):
        from django.db.models import Sum
        from django.db.models.functions import Coalesce
        
        spent = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type='expense',
            transaction_date__month=obj.month.month,
            transaction_date__year=obj.month.year
        ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
        return str(spent)


class FeedbackSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = ['id', 'user', 'email', 'message', 'status', 'created_at']
    
    def get_user(self, obj):
        if obj.user and hasattr(obj.user, 'profile'):
            return obj.user.profile.full_name or 'Guest'
        return 'Guest'


class SecurityLogSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityLog
        fields = ['id', 'title', 'user', 'time', 'status']
        
    def get_user(self, obj):
        return obj.user.email if obj.user else 'System'
        
    def get_time(self, obj):
        return obj.created_at.strftime('%b %d, %Y %I:%M %p')
