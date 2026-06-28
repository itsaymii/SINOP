from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminDashboardView,
    BillReminderViewSet,
    BudgetViewSet,
    CategoryViewSet,
    DashboardWidgetViewSet,
    FinancialAccountViewSet,
    IncomeSourceViewSet,
    NotificationViewSet,
    RecurringTransactionViewSet,
    SavingsGoalViewSet,
    TransactionViewSet,
    UserSettingsView,
    health_check,
    login,
    logout,
    me,
    register,
)

router = DefaultRouter()
router.register('accounts', FinancialAccountViewSet, basename='account')
router.register('categories', CategoryViewSet, basename='category')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('budgets', BudgetViewSet, basename='budget')
router.register('income-sources', IncomeSourceViewSet, basename='income-source')
router.register('bills', BillReminderViewSet, basename='bill')
router.register('goals', SavingsGoalViewSet, basename='goal')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('recurring-transactions', RecurringTransactionViewSet, basename='recurring-transaction')
router.register('dashboard-widgets', DashboardWidgetViewSet, basename='dashboard-widget')

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/me/', me, name='me'),
    path('auth/logout/', logout, name='logout'),
    path('settings/', UserSettingsView.as_view(), name='user-settings'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('', include(router.urls)),
]
