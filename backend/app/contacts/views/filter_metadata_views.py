from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.contacts.models import Contact
from app.contacts.models.choices import ImportanceLevel
from app.custom_fields.models import CustomField
from app.categories.models import Occupation


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def contact_filter_metadata(request):
    """Trả về metadata về các field có thể filter cho Contact"""
    fields = [
        {
            "name": "full_name",
            "label": "Họ và tên",
            "type": "text",
        },
        {
            "name": "nickname",
            "label": "Biệt danh",
            "type": "text",
        },
        {
            "name": "occupation",
            "label": "Ngành nghề",
            "type": "dropdown",
            "multiple": True,
            "options": [
                {"value": str(o.id), "label": o.name}
                for o in Occupation.objects.filter(is_active=True).order_by("name")
            ],
        },
        {
            "name": "phone_number",
            "label": "Số điện thoại",
            "type": "text",
        },
        {
            "name": "importance",
            "label": "Độ quan trọng",
            "type": "dropdown",
            "options": [
                {"value": "low", "label": "Thấp"},
                {"value": "medium", "label": "Trung bình"},
                {"value": "high", "label": "Cao"},
                {"value": "very_high", "label": "Rất cao"},
            ],
        },
        {
            "name": "date_of_birth",
            "label": "Ngày sinh",
            "type": "date",
        },
        {
            "name": "hometown",
            "label": "Quê quán",
            "type": "text",
        },
        {
            "name": "current_address",
            "label": "Chỗ ở hiện tại",
            "type": "text",
        },
        {
            "name": "created_at",
            "label": "Ngày tạo",
            "type": "date",
        },
    ]

    # Thêm custom fields nếu có
    custom_fields = CustomField.objects.filter(
        target_model="contact", is_active=True, is_filterable=True
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

    return Response({"fields": fields})

