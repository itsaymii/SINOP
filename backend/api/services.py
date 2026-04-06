from datetime import date

from .models import (
    DashboardWidget,
    UserProfile,
    UserSettings,
)

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