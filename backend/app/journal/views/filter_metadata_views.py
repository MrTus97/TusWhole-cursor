from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings

from app.custom_fields.models import CustomField


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def journal_filter_metadata(request):
    """
    Trả về metadata về các field có thể filter và default columns cho JournalEntry
    """
    fields = [
        {"name": "title", "label": "Tiêu đề", "type": "text"},
        {"name": "content_text", "label": "Nội dung", "type": "text"},
        {"name": "written_at", "label": "Thời điểm viết", "type": "datetime"},
        {"name": "created_at", "label": "Ngày tạo", "type": "datetime"},
        {"name": "updated_at", "label": "Ngày cập nhật", "type": "datetime"},
        {"name": "hashtags", "label": "Hashtags", "type": "text"},
    ]

    # Thêm custom fields nếu có (target_model = journal)
    custom_fields = CustomField.objects.filter(
        target_model="journal", is_active=True, is_filterable=True
    ).order_by("order", "name")
    for cf in custom_fields:
        field_data = {
            "name": f"custom_field_{cf.id}",
            "label": cf.name,
            "type": cf.field_type,
        }
        if cf.field_type in ["dropdown", "radio"] and cf.options:
            field_data["options"] = [{"value": opt, "label": opt} for opt in cf.options]
        fields.append(field_data)

    default_columns = ["title", "written_at", "updated_at", "hashtags"]
    default_page_size = api_settings.PAGE_SIZE or 100
    return Response(
        {
            "fields": fields,
            "default_columns": default_columns,
            "default_page_size": default_page_size,
        }
    )


