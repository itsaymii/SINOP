from django.urls import path

from .views import AdminDashboardSummaryView, DashboardSummaryView

urlpatterns = [
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('admin/dashboard/', AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
]
