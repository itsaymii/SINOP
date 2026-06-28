from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import (
    BillReminder,
    Budget,
    Category,
    DashboardWidget,
    FinancialAccount,
    Feedback,
    IncomeSource,
    Notification,
    SavingsGoal,
    SecurityLog,
    Transaction,
)
from api.serializers import (
    AdminBudgetSerializer,
    AdminCategorySerializer,
    AdminTransactionSerializer,
    BillReminderSerializer,
    CategorySerializer,
    DashboardWidgetSerializer,
    FinancialAccountSerializer,
    FeedbackSerializer,
    IncomeSourceSerializer,
    NotificationSerializer,
    SecurityLogSerializer,
    SavingsGoalSerializer,
    TransactionSerializer,
    UserSerializer,
)
from api.services import bootstrap_user_data, ensure_admin_account, first_day_of_month

User = get_user_model()


class DashboardSummaryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        bootstrap_user_data(user)
        today = date.today()
        month_start = first_day_of_month(today)
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

        accounts = FinancialAccount.objects.filter(user=user, is_active=True)
        transactions = Transaction.objects.filter(user=user)
        monthly_transactions = transactions.filter(transaction_date__gte=month_start, transaction_date__lt=next_month)
        budgets = Budget.objects.filter(user=user, month=month_start).select_related('category')
        goals = SavingsGoal.objects.filter(user=user)
        bills = BillReminder.objects.filter(user=user, is_active=True).order_by('due_date')[:5]
        notifications = Notification.objects.filter(user=user).order_by('-created_at')[:5]
        widgets = DashboardWidget.objects.filter(user=user)
        income_sources = IncomeSource.objects.filter(user=user, is_active=True)

        total_balance = sum(
            (
                account.balance * Decimal('-1')
                if account.account_type in {'credit', 'loan'}
                else account.balance
            )
            for account in accounts
        )
        monthly_income = monthly_transactions.filter(transaction_type='income').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0.00'))
        )['total']
        monthly_expenses = monthly_transactions.filter(transaction_type='expense').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0.00'))
        )['total']
        monthly_savings = monthly_income - monthly_expenses

        category_breakdown = (
            monthly_transactions.filter(transaction_type='expense', category__isnull=False)
            .values('category__name', 'category__color')
            .annotate(total=Coalesce(Sum('amount'), Decimal('0.00')))
            .order_by('-total')
        )

        spending_trend = (
            transactions.filter(transaction_type='expense')
            .annotate(month=TruncMonth('transaction_date'))
            .values('month')
            .annotate(total=Coalesce(Sum('amount'), Decimal('0.00')))
            .order_by('month')
        )

        budget_progress = []
        for budget in budgets:
            spent = monthly_transactions.filter(transaction_type='expense', category=budget.category).aggregate(
                total=Coalesce(Sum('amount'), Decimal('0.00'))
            )['total']
            progress = float((spent / budget.amount) * 100) if budget.amount else 0
            status_label = 'on-track'
            if progress >= 100:
                status_label = 'exceeded'
            elif progress >= budget.alert_threshold:
                status_label = 'nearing-limit'
            budget_progress.append(
                {
                    'id': budget.id,
                    'category': budget.category.name,
                    'color': budget.category.color,
                    'budget_amount': str(budget.amount),
                    'spent_amount': str(spent),
                    'progress_percentage': round(progress, 2),
                    'status': status_label,
                }
            )

        return Response(
            {
                'summary': {
                    'total_balance': str(total_balance),
                    'monthly_income': str(monthly_income),
                    'monthly_expenses': str(monthly_expenses),
                    'monthly_savings': str(monthly_savings),
                },
                'recent_transactions': TransactionSerializer(transactions[:8], many=True).data,
                'transactions': TransactionSerializer(transactions[:50], many=True).data,
                'accounts': FinancialAccountSerializer(accounts, many=True).data,
                'categories': CategorySerializer(Category.objects.filter(user=user), many=True).data,
                'budgets': budget_progress,
                'goals': SavingsGoalSerializer(goals, many=True).data,
                'bills': BillReminderSerializer(bills, many=True).data,
                'income_sources': IncomeSourceSerializer(income_sources, many=True).data,
                'notifications': NotificationSerializer(notifications, many=True).data,
                'widgets': DashboardWidgetSerializer(widgets, many=True).data,
                'analytics': {
                    'expenses_by_category': [
                        {
                            'category': item['category__name'],
                            'color': item['category__color'],
                            'total': str(item['total']),
                        }
                        for item in category_breakdown
                    ],
                    'spending_over_time': [
                        {
                            'month': item['month'].strftime('%b %Y') if item['month'] else '',
                            'total': str(item['total']),
                        }
                        for item in spending_trend
                    ],
                    'monthly_comparison': [
                        {'label': 'Income', 'value': str(monthly_income)},
                        {'label': 'Expenses', 'value': str(monthly_expenses)},
                        {'label': 'Savings', 'value': str(monthly_savings)},
                    ],
                },
            }
        )


class AdminDashboardSummaryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        ensure_admin_account()
        today = date.today()
        month_start = first_day_of_month(today)
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

        total_users = User.objects.count()
        total_active_users = User.objects.filter(is_active=True).count()
        total_accounts = FinancialAccount.objects.count()
        total_transactions = Transaction.objects.count()
        total_categories = Category.objects.count()
        total_budgets = Budget.objects.count()
        total_goals = SavingsGoal.objects.count()
        total_feedback = Feedback.objects.count()
        total_notifications = Notification.objects.count()
        total_logs = SecurityLog.objects.count()
        net_balance = FinancialAccount.objects.aggregate(
            total=Coalesce(Sum('balance'), Value(0, output_field=DecimalField()))
        )['total'] or Decimal('0.00')

        monthly_transactions = Transaction.objects.filter(
            transaction_date__gte=month_start,
            transaction_date__lt=next_month,
        )
        monthly_income = monthly_transactions.filter(transaction_type='income').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0.00'))
        )['total'] or Decimal('0.00')
        monthly_expenses = monthly_transactions.filter(transaction_type='expense').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0.00'))
        )['total'] or Decimal('0.00')
        monthly_savings = monthly_income - monthly_expenses

        recent_users = User.objects.order_by('-date_joined')[:5]
        recent_transactions = Transaction.objects.select_related('user', 'category').order_by('-transaction_date')[:10]
        categories = Category.objects.annotate(total=Count('transactions')).order_by('-total')[:8]
        budgets = Budget.objects.select_related('category').all()[:8]
        feedbacks = Feedback.objects.order_by('-created_at')[:8]
        logs = SecurityLog.objects.order_by('-created_at')[:8]
        notifications = Notification.objects.order_by('-created_at')[:8]

        return Response(
            {
                'summary': {
                    'total_users': total_users,
                    'active_users': total_active_users,
                    'total_accounts': total_accounts,
                    'total_transactions': total_transactions,
                    'total_categories': total_categories,
                    'total_budgets': total_budgets,
                    'total_goals': total_goals,
                    'total_feedback': total_feedback,
                    'total_notifications': total_notifications,
                    'total_logs': total_logs,
                    'net_balance': str(net_balance),
                    'monthly_income': str(monthly_income),
                    'monthly_expenses': str(monthly_expenses),
                    'monthly_savings': str(monthly_savings),
                    'server_online': True,
                },
                'recent_users': UserSerializer(recent_users, many=True).data,
                'transactions': AdminTransactionSerializer(recent_transactions, many=True).data,
                'categories': AdminCategorySerializer(categories, many=True).data,
                'budgets': AdminBudgetSerializer(budgets, many=True).data,
                'feedback': FeedbackSerializer(feedbacks, many=True).data,
                'logs': SecurityLogSerializer(logs, many=True).data,
                'notifications': NotificationSerializer(notifications, many=True).data,
            }
        )
