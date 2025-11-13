from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from app.custom_fields.models import CustomField
from app.custom_fields.serializers import CustomFieldSerializer
from app.custom_fields.services import CustomFieldService


@extend_schema_view(
    list=extend_schema(tags=["Custom Fields"], summary="Danh sách custom fields"),
    create=extend_schema(tags=["Custom Fields"], summary="Tạo custom field mới"),
    retrieve=extend_schema(tags=["Custom Fields"], summary="Chi tiết custom field"),
    update=extend_schema(tags=["Custom Fields"], summary="Cập nhật custom field"),
    partial_update=extend_schema(
        tags=["Custom Fields"], summary="Cập nhật một phần custom field"
    ),
    destroy=extend_schema(tags=["Custom Fields"], summary="Xoá custom field"),
)
class CustomFieldViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomFieldSerializer
    filterset_fields = ["target_model", "field_type", "is_active"]
    ordering_fields = ["order", "name", "created_at"]
    search_fields = ["name", "description"]

    def get_queryset(self):
        queryset = CustomFieldService.list_custom_fields()
        target_model = self.request.query_params.get("target_model", None)
        if target_model:
            queryset = queryset.filter(target_model=target_model)
        return queryset

    def perform_create(self, serializer):
        CustomFieldService.create_custom_field(**serializer.validated_data)

    def perform_update(self, serializer):
        CustomFieldService.update_custom_field(
            serializer.instance, **serializer.validated_data
        )

