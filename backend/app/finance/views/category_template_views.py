from django.db import models as django_models
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from app.finance.models import CategoryTemplate
from app.finance.serializers import CategoryTemplateSerializer


CATEGORY_TEMPLATE_SEARCH_FIELDS = [
    field.name
    for field in CategoryTemplate._meta.get_fields()
    if getattr(field, "attname", None)
    and field.concrete
    and isinstance(field, (django_models.CharField, django_models.TextField))
]
CATEGORY_TEMPLATE_SEARCH_FIELDS += ["parent__name"]


@extend_schema_view(
    list=extend_schema(
        tags=["Finance - Master Categories"], summary="Danh sách master category"
    )
)
class CategoryTemplateViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategoryTemplateSerializer
    queryset = CategoryTemplate.objects.select_related("parent").all()
    filterset_fields = "__all__"
    ordering_fields = "__all__"
    search_fields = CATEGORY_TEMPLATE_SEARCH_FIELDS

