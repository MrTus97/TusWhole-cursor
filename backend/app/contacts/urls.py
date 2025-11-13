from django.urls import path
from rest_framework.routers import DefaultRouter

from app.contacts.views import ContactViewSet
from app.contacts.views.filter_metadata_views import contact_filter_metadata

router = DefaultRouter()
router.register(r"contacts", ContactViewSet, basename="contact")

urlpatterns = router.urls + [
    path("filter-metadata/contacts/", contact_filter_metadata, name="contact-filter-metadata"),
]

