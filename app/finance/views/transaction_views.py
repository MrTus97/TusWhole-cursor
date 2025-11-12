from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.finance.models import Transaction
from app.finance.serializers import TransactionSerializer
from app.finance.services import TransactionService


@extend_schema_view(
    list=extend_schema(tags=["Finance - Transactions"], summary="Danh sách giao dịch"),
    create=extend_schema(tags=["Finance - Transactions"], summary="Tạo giao dịch"),
    retrieve=extend_schema(tags=["Finance - Transactions"], summary="Chi tiết giao dịch"),
    update=extend_schema(tags=["Finance - Transactions"], summary="Cập nhật giao dịch"),
    partial_update=extend_schema(
        tags=["Finance - Transactions"], summary="Cập nhật một phần giao dịch"
    ),
    destroy=extend_schema(tags=["Finance - Transactions"], summary="Xoá giao dịch"),
)
class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        wallet_id = self.request.query_params.get("wallet")
        queryset = Transaction.objects.filter(wallet__owner=self.request.user).select_related(
            "wallet", "category"
        )
        if wallet_id:
            queryset = queryset.filter(wallet_id=wallet_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        wallet = serializer.validated_data["wallet"]
        category = serializer.validated_data["category"]
        self._check_wallet_permission(wallet.owner_id)

        if category.wallet_id != wallet.id:
            raise ValidationError({"category": "Category không thuộc ví đã chọn."})

        extra_data = {}
        for key in ("note", "occurred_at", "metadata"):
            if key in serializer.validated_data:
                extra_data[key] = serializer.validated_data[key]

        transaction = TransactionService.create_transaction(
            wallet,
            category,
            transaction_type=serializer.validated_data.get("transaction_type"),
            amount=serializer.validated_data["amount"],
            **extra_data,
        )
        output_serializer = self.get_serializer(transaction)
        headers = self.get_success_headers(output_serializer.data)
        return Response(
            output_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_update(self, serializer):
        transaction_obj = serializer.instance
        self._check_wallet_permission(transaction_obj.wallet.owner_id)

        update_kwargs = {}
        for field in ("transaction_type", "amount", "note", "occurred_at", "metadata"):
            if field in serializer.validated_data:
                update_kwargs[field] = serializer.validated_data[field]

        updated = TransactionService.update_transaction(
            transaction_obj,
            **update_kwargs,
        )
        serializer.instance = updated

    def destroy(self, request, *args, **kwargs):
        transaction_obj = self.get_object()
        self._check_wallet_permission(transaction_obj.wallet.owner_id)
        TransactionService.delete_transaction(transaction_obj)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _check_wallet_permission(self, owner_id: int):
        if owner_id != self.request.user.id:
            raise PermissionDenied("Bạn không có quyền truy cập ví này.")

