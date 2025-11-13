from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings

from app.finance.models import Wallet, Transaction
from app.custom_fields.models import CustomField


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wallet_filter_metadata(request):
    """Trả về metadata về các field có thể filter cho Wallet"""
    fields = [
        {
            "name": "name",
            "label": "Tên ví",
            "type": "text",
        },
        {
            "name": "description",
            "label": "Mô tả",
            "type": "text",
        },
        {
            "name": "currency",
            "label": "Tiền tệ",
            "type": "dropdown",
            "options": [
                {"value": "VND", "label": "VND"},
                {"value": "USD", "label": "USD"},
                {"value": "EUR", "label": "EUR"},
            ],
        },
        {
            "name": "current_balance",
            "label": "Số dư hiện tại",
            "type": "number",
        },
        {
            "name": "created_at",
            "label": "Ngày tạo",
            "type": "date",
        },
    ]

    # Thêm custom fields nếu có
    custom_fields = CustomField.objects.filter(
        target_model="wallet", is_active=True, is_filterable=True
    ).order_by("order", "name")
    for cf in custom_fields:
        field_data = {
            "name": f"custom_field_{cf.id}",
            "label": cf.name,
            "type": cf.field_type,
        }
        if cf.field_type in ["dropdown", "radio"] and cf.options:
            field_data["options"] = [
                {"value": opt, "label": opt} for opt in cf.options
            ]
        fields.append(field_data)

    default_columns = ["name", "description", "currency", "current_balance"]
    default_page_size = api_settings.PAGE_SIZE or 100
    return Response({"fields": fields, "default_columns": default_columns, "default_page_size": default_page_size})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_filter_metadata(request):
    """Trả về metadata về các field có thể filter cho Transaction"""
    fields = [
        {
            "name": "wallet",
            "label": "Ví",
            "type": "dropdown",
            "options": [],  # Sẽ được populate từ frontend
        },
        {
            "name": "category",
            "label": "Danh mục",
            "type": "dropdown",
            "options": [],  # Sẽ được populate từ frontend
        },
        {
            "name": "transaction_type",
            "label": "Loại giao dịch",
            "type": "dropdown",
            "options": [
                {"value": "INCOME", "label": "Thu"},
                {"value": "EXPENSE", "label": "Chi"},
                {"value": "LEND", "label": "Cho vay"},
                {"value": "BORROW", "label": "Đi vay"},
            ],
        },
        {
            "name": "amount",
            "label": "Số tiền",
            "type": "number",
        },
        {
            "name": "note",
            "label": "Ghi chú",
            "type": "text",
        },
        {
            "name": "occurred_at",
            "label": "Thời gian",
            "type": "datetime",
        },
    ]

    # Thêm custom fields nếu có
    custom_fields = CustomField.objects.filter(
        target_model="transaction", is_active=True, is_filterable=True
    ).order_by("order", "name")
    for cf in custom_fields:
        field_data = {
            "name": f"custom_field_{cf.id}",
            "label": cf.name,
            "type": cf.field_type,
        }
        if cf.field_type in ["dropdown", "radio"] and cf.options:
            field_data["options"] = [
                {"value": opt, "label": opt} for opt in cf.options
            ]
        fields.append(field_data)

    default_columns = ["wallet", "category",
                       "transaction_type", "amount", "occurred_at", "note"]
    default_columns = ["wallet", "category",
                       "transaction_type", "amount", "occurred_at", "note"]
    default_page_size = api_settings.PAGE_SIZE or 100
    return Response({"fields": fields, "default_columns": default_columns, "default_page_size": default_page_size})
