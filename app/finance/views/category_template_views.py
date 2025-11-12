from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from app.finance.models import CategoryTemplate
from app.finance.serializers import CategoryTemplateSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Finance - Master Categories"], summary="Danh sách master category"
    )
)
class CategoryTemplateViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategoryTemplateSerializer
    queryset = CategoryTemplate.objects.select_related("parent").all()

