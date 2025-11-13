from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def custom_field_filter_metadata(request):
    """
    Trả về metadata filter và default columns cho danh sách CustomField
    """
    fields = [
        {"name": "name", "label": "Tên trường", "type": "text"},
        {"name": "description", "label": "Mô tả", "type": "text"},
        {
            "name": "field_type",
            "label": "Kiểu dữ liệu",
            "type": "dropdown",
            "options": [
                {"value": "text", "label": "Text"},
                {"value": "textarea", "label": "Textarea"},
                {"value": "number", "label": "Number"},
                {"value": "date", "label": "Date"},
                {"value": "datetime", "label": "DateTime"},
                {"value": "boolean", "label": "Boolean"},
                {"value": "dropdown", "label": "Dropdown"},
                {"value": "checkbox", "label": "Checkbox"},
                {"value": "radio", "label": "Radio"},
            ],
        },
        {
            "name": "target_model",
            "label": "Áp dụng cho",
            "type": "dropdown",
            "options": [
                {"value": "contact", "label": "Contact"},
                {"value": "wallet", "label": "Wallet"},
                {"value": "transaction", "label": "Transaction"},
                {"value": "journal", "label": "Journal"},
            ],
        },
        {"name": "is_active", "label": "Kích hoạt", "type": "dropdown", "options": [{"value": "true", "label": "Có"}, {"value": "false", "label": "Không"}]},
        {"name": "is_filterable", "label": "Có filter", "type": "dropdown", "options": [{"value": "true", "label": "Có"}, {"value": "false", "label": "Không"}]},
        {"name": "order", "label": "Thứ tự", "type": "number"},
        {"name": "created_at", "label": "Ngày tạo", "type": "datetime"},
    ]
    default_columns = ["name", "field_type", "target_model", "is_active", "order"]
    default_page_size = api_settings.PAGE_SIZE or 100
    return Response(
        {
            "fields": fields,
            "default_columns": default_columns,
            "default_page_size": default_page_size,
        }
    )


