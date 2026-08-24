from django.urls import path
from . import views

urlpatterns = [
    path('token/', views.get_realtime_token, name='get_realtime_token'),
    path('feedback/', views.get_feedback, name='get_feedback'),
]