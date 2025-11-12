from django.db import models as django_models
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.finance.models import Category
from app.finance.repositories import WalletRepository
from app.finance.serializers import CategorySerializer
from app.finance.services import CategoryService


CATEGORY_SEARCH_FIELDS = [
    field.name
    for field in Category._meta.get_fields()
    if getattr(field, "attname", None)
    and field.concrete
    and isinstance(field, (django_models.CharField, django_models.TextField))
]
CATEGORY_SEARCH_FIELDS += [
    "wallet__name",
    "wallet__owner__username",
    "parent__name",
    "template__name",
]


@extend_schema_view(
    list=extend_schema(tags=["Finance - Categories"], summary="Danh sách category"),
    create=extend_schema(tags=["Finance - Categories"], summary="Tạo category mới"),
    retrieve=extend_schema(tags=["Finance - Categories"], summary="Chi tiết category"),
    update=extend_schema(tags=["Finance - Categories"], summary="Cập nhật category"),
    partial_update=extend_schema(
        tags=["Finance - Categories"], summary="Cập nhật một phần category"
    ),
    destroy=extend_schema(tags=["Finance - Categories"], summary="Xoá category"),
)
class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer
    filterset_fields = "__all__"
    ordering_fields = "__all__"
    search_fields = CATEGORY_SEARCH_FIELDS

    def get_queryset(self):
        wallet_id = self.request.query_params.get("wallet")
        if wallet_id:
            wallet = WalletRepository.get_by_id(wallet_id)
            self._check_wallet_permission(wallet.owner_id)
            return CategoryService.list_categories(wallet)
        return Category.objects.filter(wallet__owner=self.request.user).select_related(
            "wallet", "parent", "template"
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data.copy()
        wallet = WalletRepository.get_by_id(data.pop("wallet").id)
        self._check_wallet_permission(wallet.owner_id)

        category = CategoryService.create_category(wallet, **data)
        output_serializer = self.get_serializer(category)
        headers = self.get_success_headers(output_serializer.data)
        return Response(
            output_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_update(self, serializer):
        wallet = serializer.instance.wallet
        self._check_wallet_permission(wallet.owner_id)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        self._check_wallet_permission(category.wallet.owner_id)
        return super().destroy(request, *args, **kwargs)

    def _check_wallet_permission(self, owner_id: int):
        if owner_id != self.request.user.id:
            raise PermissionDenied("Bạn không có quyền truy cập ví này.")

