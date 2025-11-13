from django.urls import path
from rest_framework.routers import DefaultRouter

from app.custom_fields.views import CustomFieldViewSet
from app.custom_fields.views.filter_metadata_views import custom_field_filter_metadata

router = DefaultRouter()
router.register(r"custom-fields", CustomFieldViewSet, basename="custom-field")

urlpatterns = router.urls + [
    path("filter-metadata/custom-fields/", custom_field_filter_metadata, name="custom-field-filter-metadata"),
]

