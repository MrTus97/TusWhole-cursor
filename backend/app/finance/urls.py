from django.urls import path
from rest_framework.routers import DefaultRouter

from app.finance.views import (
    CategoryTemplateViewSet,
    CategoryViewSet,
    TransactionViewSet,
    WalletViewSet,
    FundViewSet,
)
from app.finance.views.filter_metadata_views import (
    transaction_filter_metadata,
    wallet_filter_metadata,
)

router = DefaultRouter()
router.register(r"wallets", WalletViewSet, basename="wallet")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(
    r"category-templates", CategoryTemplateViewSet, basename="category-template"
)
router.register(r"funds", FundViewSet, basename="fund")

urlpatterns = router.urls + [
    path("filter-metadata/wallets/", wallet_filter_metadata, name="wallet-filter-metadata"),
    path("filter-metadata/transactions/", transaction_filter_metadata, name="transaction-filter-metadata"),
]

