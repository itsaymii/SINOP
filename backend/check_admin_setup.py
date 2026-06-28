import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django

django.setup()
from api.services import ensure_admin_account

user = ensure_admin_account()
print('admin', user.email, user.is_staff)
