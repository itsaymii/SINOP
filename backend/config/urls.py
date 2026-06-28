from django.urls import include, path

from api.admin import admin_site

urlpatterns = [
    path('admin/', admin_site.urls),    path('api/', include('dashboard.urls')),    path('api/', include('api.urls')),
]
