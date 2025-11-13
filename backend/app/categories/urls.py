from rest_framework.routers import DefaultRouter

from app.categories.views import OccupationViewSet

router = DefaultRouter()
router.register(r"occupations", OccupationViewSet, basename="occupation")

urlpatterns = router.urls


