from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from app.journal.filtersets import JournalEntryFilterSet
from app.journal.serializers import JournalEntrySerializer
from app.journal.services import JournalService


@extend_schema_view(
    list=extend_schema(tags=["Journal"], summary="Danh sách nhật ký"),
    create=extend_schema(tags=["Journal"], summary="Tạo nhật ký mới"),
    retrieve=extend_schema(tags=["Journal"], summary="Chi tiết nhật ký"),
    update=extend_schema(tags=["Journal"], summary="Cập nhật nhật ký"),
    partial_update=extend_schema(tags=["Journal"], summary="Cập nhật một phần nhật ký"),
    destroy=extend_schema(tags=["Journal"], summary="Xoá nhật ký"),
)
class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]
    filterset_class = JournalEntryFilterSet
    search_fields = ["title", "content_text", "hashtags__name"]
    ordering_fields = ["written_at", "created_at", "updated_at"]

    def get_queryset(self):
        return JournalService.list_entries(self.request.user)


