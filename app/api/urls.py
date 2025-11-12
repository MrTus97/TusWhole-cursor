from django.urls import path

from app.api import views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
]

