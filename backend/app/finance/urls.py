from rest_framework.routers import DefaultRouter

from app.finance.views import (
    CategoryTemplateViewSet,
    CategoryViewSet,
    TransactionViewSet,
    WalletViewSet,
)

router = DefaultRouter()
router.register(r"wallets", WalletViewSet, basename="wallet")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(
    r"category-templates", CategoryTemplateViewSet, basename="category-template"
)

urlpatterns = router.urls

