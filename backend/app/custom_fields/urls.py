from rest_framework.routers import DefaultRouter

from app.custom_fields.views import CustomFieldViewSet

router = DefaultRouter()
router.register(r"custom-fields", CustomFieldViewSet, basename="custom-field")

urlpatterns = router.urls

