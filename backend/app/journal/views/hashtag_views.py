from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from app.journal.serializers import JournalHashtagSerializer
from app.journal.services import JournalService


@extend_schema_view(
    list=extend_schema(tags=["Journal"], summary="Danh sách hashtag nhật ký"),
)
class JournalHashtagViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = JournalHashtagSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name"]
    ordering = ["name"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return JournalService.list_hashtags(self.request.user)


