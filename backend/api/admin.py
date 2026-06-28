from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce

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
    UserProfile,
    UserSettings,
)

User = get_user_model()


class SinopAdminSite(admin.AdminSite):
    site_header = 'Sinop Administration'
    site_title = 'Sinop Admin'
    index_title = 'Sinop dashboard'
    index_template = 'admin/index.html'

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context.update({
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'total_accounts': FinancialAccount.objects.count(),
            'total_transactions': Transaction.objects.count(),
            'total_categories': Category.objects.count(),
            'total_notifications': Notification.objects.count(),
            'net_balance': FinancialAccount.objects.aggregate(total=Coalesce(Sum('balance'), Value(0, output_field=DecimalField())))['total'] or 0,
            'recent_users': User.objects.order_by('-date_joined')[:5],
        })
        return super().index(request, extra_context=extra_context)


admin_site = SinopAdminSite(name='sinop_admin')


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'monthly_budget_goal', 'updated_at')
    search_fields = ('full_name', 'user__email', 'user__username')


class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'currency', 'dark_mode', 'two_factor_enabled', 'updated_at')
    search_fields = ('user__email', 'user__username')
    list_filter = ('currency', 'dark_mode', 'two_factor_enabled')


class FinancialAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'account_type', 'balance', 'currency', 'is_active', 'updated_at')
    search_fields = ('name', 'user__email', 'user__username')
    list_filter = ('account_type', 'currency', 'is_active')


class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'user', 'is_default', 'updated_at')
    search_fields = ('name', 'user__email', 'user__username')
    list_filter = ('category_type', 'is_default')


class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'account', 'category', 'amount', 'frequency', 'next_run_date', 'is_active')
    search_fields = ('title', 'user__email', 'user__username', 'account__name', 'category__name')
    list_filter = ('frequency', 'is_active')
    autocomplete_fields = ('account', 'category')


class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'account', 'transaction_type', 'amount', 'transaction_date', 'category', 'is_auto_generated')
    search_fields = ('account__name', 'category__name', 'user__email', 'user__username', 'notes')
    list_filter = ('transaction_type', 'transaction_date', 'is_auto_generated')
    autocomplete_fields = ('account', 'category', 'transfer_account', 'recurring_template')


class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'month', 'amount', 'alert_threshold')
    search_fields = ('category__name', 'user__email', 'user__username')
    list_filter = ('month',)


class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'amount', 'frequency', 'next_payment_date', 'is_active')
    search_fields = ('name', 'user__email', 'user__username')
    list_filter = ('frequency', 'is_active')


class BillReminderAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'amount', 'due_date', 'frequency', 'is_paid', 'is_active')
    search_fields = ('title', 'user__email', 'user__username')
    list_filter = ('frequency', 'is_paid', 'is_active')


class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'target_amount', 'current_amount', 'target_date', 'updated_at')
    search_fields = ('name', 'user__email', 'user__username')
    list_filter = ('target_date',)


class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'scheduled_for', 'created_at')
    search_fields = ('title', 'message', 'user__email', 'user__username')
    list_filter = ('notification_type', 'is_read')


class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'key', 'title', 'is_visible', 'display_order')
    search_fields = ('title', 'key', 'user__email', 'user__username')
    list_filter = ('is_visible',)


admin_site.register(UserProfile, UserProfileAdmin)
admin_site.register(UserSettings, UserSettingsAdmin)
admin_site.register(FinancialAccount, FinancialAccountAdmin)
admin_site.register(Category, CategoryAdmin)
admin_site.register(RecurringTransaction, RecurringTransactionAdmin)
admin_site.register(Transaction, TransactionAdmin)
admin_site.register(Budget, BudgetAdmin)
admin_site.register(IncomeSource, IncomeSourceAdmin)
admin_site.register(BillReminder, BillReminderAdmin)
admin_site.register(SavingsGoal, SavingsGoalAdmin)
admin_site.register(Notification, NotificationAdmin)
admin_site.register(DashboardWidget, DashboardWidgetAdmin)
