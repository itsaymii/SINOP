from datetime import date

from django.conf import settings
from django.contrib.auth import get_user_model

from .models import (
    DashboardWidget,
    UserProfile,
    UserSettings,
)

User = get_user_model()


def ensure_admin_account():
    admin_email = getattr(settings, 'DEFAULT_ADMIN_EMAIL', 'admin@sinop.local').strip().lower()
    admin_password = getattr(settings, 'DEFAULT_ADMIN_PASSWORD', 'SinopAdmin123!')
    admin_full_name = getattr(settings, 'DEFAULT_ADMIN_FULL_NAME', 'Sinop Admin')

    user = User.objects.filter(email__iexact=admin_email).first()
    if user is None:
        user = User.objects.create_user(
            username=admin_email,
            email=admin_email,
            password=admin_password,
            is_staff=True,
        )
        profile = ensure_profile(user, admin_full_name)
        profile.monthly_budget_goal = None
        profile.save(update_fields=['monthly_budget_goal', 'updated_at'])
        ensure_settings(user)
        for order, (key, title) in enumerate(DEFAULT_WIDGETS, start=1):
            DashboardWidget.objects.get_or_create(
                user=user,
                key=key,
                defaults={'title': title, 'display_order': order, 'is_visible': True},
            )
    elif not user.is_staff:
        user.is_staff = True
        user.save(update_fields=['is_staff'])
    return user

DEFAULT_WIDGETS = [
    ('summary', 'Summary cards'),
    ('transactions', 'Recent transactions'),
    ('budgets', 'Budget tracking'),
    ('analytics', 'Analytics overview'),
    ('goals', 'Savings goals'),
    ('calendar', 'Calendar view'),
]


def first_day_of_month(value=None):
    target = value or date.today()
    return target.replace(day=1)


def ensure_profile(user, full_name=''):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'full_name': full_name or user.get_full_name() or user.email or user.username},
    )
    return profile


def ensure_settings(user):
    settings, _ = UserSettings.objects.get_or_create(user=user)
    return settings


def bootstrap_user_data(user, full_name=''):
    profile = ensure_profile(user, full_name)
    ensure_settings(user)

    for order, (key, title) in enumerate(DEFAULT_WIDGETS, start=1):
        DashboardWidget.objects.get_or_create(
            user=user,
            key=key,
            defaults={'title': title, 'display_order': order, 'is_visible': True},
        )

    return profile