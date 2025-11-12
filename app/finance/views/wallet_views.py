from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.finance.serializers import WalletSerializer
from app.finance.services import WalletService


@extend_schema_view(
    list=extend_schema(tags=["Finance - Wallets"], summary="Danh sách ví"),
    create=extend_schema(tags=["Finance - Wallets"], summary="Tạo ví mới"),
    retrieve=extend_schema(tags=["Finance - Wallets"], summary="Chi tiết ví"),
    update=extend_schema(tags=["Finance - Wallets"], summary="Cập nhật ví"),
    partial_update=extend_schema(
        tags=["Finance - Wallets"], summary="Cập nhật một phần ví"
    ),
    destroy=extend_schema(tags=["Finance - Wallets"], summary="Xoá ví"),
)
class WalletViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get_queryset(self):
        return WalletService.list_wallets(self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        copy_master_raw = data.pop("copy_master", ["true"])
        copy_master = self._parse_bool(copy_master_raw)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        wallet = WalletService.create_wallet(
            request.user,
            copy_master_categories=copy_master,
            **serializer.validated_data,
        )
        output_serializer = self.get_serializer(wallet)
        headers = self.get_success_headers(output_serializer.data)
        return Response(
            output_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_update(self, serializer):
        WalletService.update_wallet(serializer.instance, **serializer.validated_data)

    @staticmethod
    def _parse_bool(value):
        if isinstance(value, (list, tuple)):
            value = value[0]
        if isinstance(value, bool):
            return value
        if value is None:
            return True
        return str(value).lower() not in {"false", "0", "no"}

