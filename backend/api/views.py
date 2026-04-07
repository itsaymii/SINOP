from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import authenticate
from django.db.models import Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from rest_framework import permissions, status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    BillReminder,
    Budget,
    Category,
    DashboardWidget,
    FinancialAccount,
    IncomeSource,
    Notification,
    RecurringTransaction,
    SavingsGoal,
    Transaction,
    UserSettings,
)
from .serializers import (
    BillReminderSerializer,
    BudgetSerializer,
    CategorySerializer,
    DashboardWidgetSerializer,
    FinancialAccountSerializer,
    IncomeSourceSerializer,
    LoginSerializer,
    NotificationSerializer,
    ProfileUpdateSerializer,
    RecurringTransactionSerializer,
    RegisterSerializer,
    SavingsGoalSerializer,
    TransactionSerializer,
    UserSerializer,
    UserSettingsSerializer,
)
from .services import bootstrap_user_data, ensure_profile, ensure_settings, first_day_of_month


class UserOwnedModelViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['GET'])
def health_check(request):
    return Response(
        {
            'message': 'Django backend is connected.',
            'frameworks': ['React', 'Tailwind CSS', 'Django'],
            'status': 'ok',
        }
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    return Response(
        {
            'user': UserSerializer(user).data,
            'message': 'Account created successfully. Please log in with your credentials.',
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    user = authenticate(username=email, password=password)

    if user is None:
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)

    bootstrap_user_data(user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful.',
        }
    )


@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    bootstrap_user_data(request.user)

    if request.method == 'PATCH':
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

    return Response({'user': UserSerializer(request.user).data})


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class FinancialAccountViewSet(UserOwnedModelViewSet):
    queryset = FinancialAccount.objects.all()
    serializer_class = FinancialAccountSerializer


class CategoryViewSet(UserOwnedModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TransactionViewSet(UserOwnedModelViewSet):
    queryset = Transaction.objects.select_related('account', 'category', 'transfer_account').all()
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        transaction_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        search = self.request.query_params.get('search')
        sort = self.request.query_params.get('sort', '-transaction_date')

        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if category:
            queryset = queryset.filter(category_id=category)
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        if search:
            queryset = queryset.filter(Q(notes__icontains=search) | Q(category__name__icontains=search))

        allowed_sorts = {'transaction_date', '-transaction_date', 'amount', '-amount', 'created_at', '-created_at'}
        if sort in allowed_sorts:
            queryset = queryset.order_by(sort)
        return queryset

class BudgetViewSet(UserOwnedModelViewSet):
    queryset = Budget.objects.select_related('category').all()
    serializer_class = BudgetSerializer


class RecurringTransactionViewSet(UserOwnedModelViewSet):
    queryset = RecurringTransaction.objects.select_related('account', 'category').all()
    serializer_class = RecurringTransactionSerializer


class IncomeSourceViewSet(UserOwnedModelViewSet):
    queryset = IncomeSource.objects.select_related('account').all()
    serializer_class = IncomeSourceSerializer


class BillReminderViewSet(UserOwnedModelViewSet):
    queryset = BillReminder.objects.select_related('account', 'category').all()
    serializer_class = BillReminderSerializer


class SavingsGoalViewSet(UserOwnedModelViewSet):
    queryset = SavingsGoal.objects.all()
    serializer_class = SavingsGoalSerializer


class NotificationViewSet(UserOwnedModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)


class DashboardWidgetViewSet(UserOwnedModelViewSet):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer


class UserSettingsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = ensure_settings(request.user)
        return Response({'settings': UserSettingsSerializer(settings).data})

    def patch(self, request):
        settings = ensure_settings(request.user)
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'settings': serializer.data})


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
