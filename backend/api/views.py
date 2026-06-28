from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import authenticate, get_user_model
from django.db.models import DecimalField, Q, Sum, Value
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
from .services import bootstrap_user_data, ensure_admin_account, ensure_profile, ensure_settings, first_day_of_month

User = get_user_model()


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
    ensure_admin_account()
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


class AdminDashboardView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is staff
        if not request.user.is_staff:
            return Response(
                {'detail': 'Only staff members can access the admin dashboard.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get all users count
        total_users = User.objects.count()
        
        # Get active users (users with transactions in last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        active_users = User.objects.filter(
            transactions__transaction_date__gte=thirty_days_ago
        ).distinct().count()
        
        # Get total budgets
        total_budgets = Budget.objects.count()
        
        # Get total transactions
        total_transactions = Transaction.objects.count()
        
        # Get all users with their data
        users = User.objects.prefetch_related('financial_accounts', 'transactions', 'budgets').all()
        users_data = []
        for user in users:
            profile = ensure_profile(user)
            try:
                total_balance = sum(
                    acc.balance for acc in user.financial_accounts.filter(is_active=True)
                )
            except:
                total_balance = 0
                
            users_data.append({
                'id': user.id,
                'email': user.email,
                'full_name': profile.full_name,
                'date_joined': user.date_joined,
                'transactions_count': user.transactions.count(),
                'budgets_count': user.budgets.count(),
                'total_balance': str(total_balance),
            })
        
        # Get recent transactions across all users
        recent_transactions = Transaction.objects.select_related(
            'user', 'category'
        ).order_by('-transaction_date')[:20]
        
        transactions_data = []
        for tx in recent_transactions:
            transactions_data.append({
                'id': tx.id,
                'user': tx.user.email,
                'type': 'Income' if tx.transaction_type == 'income' else 'Expense',
                'category': tx.category.name if tx.category else 'Uncategorized',
                'amount': str(tx.amount),
                'date': tx.transaction_date.isoformat(),
            })
        
        # Get all categories
        categories = Category.objects.all()
        categories_data = []
        for cat in categories:
            transaction_count = Transaction.objects.filter(category=cat).count()
            categories_data.append({
                'id': cat.id,
                'name': cat.name,
                'type': cat.category_type,
                'total': transaction_count,
            })
        
        # Get all budgets with progress
        budgets = Budget.objects.select_related('user', 'category').all()
        budgets_data = []
        for budget in budgets:
            # Calculate spent amount
            spent = Transaction.objects.filter(
                user=budget.user,
                category=budget.category,
                transaction_type='expense'
            ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']
            
            budgets_data.append({
                'id': budget.id,
                'user': budget.user.email,
                'category': budget.category.name if budget.category else 'General',
                'limit': str(budget.limit),
                'spent': str(spent),
                'start_date': budget.start_date.isoformat() if budget.start_date else None,
                'end_date': budget.end_date.isoformat() if budget.end_date else None,
            })
        
        # Get system stats
        server_online = True
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'total_budgets': total_budgets,
            'total_transactions': total_transactions,
            'users': users_data,
            'transactions': transactions_data,
            'categories': categories_data,
            'budgets': budgets_data,
            'server_online': server_online,
        })


