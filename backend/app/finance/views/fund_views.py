from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from app.finance.models import Fund
from app.finance.serializers import FundSerializer


@extend_schema_view(
	list=extend_schema(tags=["Finance - Funds"], summary="Danh sách quỹ"),
	create=extend_schema(tags=["Finance - Funds"], summary="Tạo quỹ"),
	retrieve=extend_schema(tags=["Finance - Funds"], summary="Chi tiết quỹ"),
	update=extend_schema(tags=["Finance - Funds"], summary="Cập nhật quỹ"),
	partial_update=extend_schema(tags=["Finance - Funds"], summary="Cập nhật một phần quỹ"),
	destroy=extend_schema(tags=["Finance - Funds"], summary="Xoá quỹ"),
)
class FundViewSet(viewsets.ModelViewSet):
	permission_classes = [IsAuthenticated]
	serializer_class = FundSerializer
	filterset_fields = "__all__"
	ordering_fields = "__all__"
	search_fields = ["name", "description"]

	def get_queryset(self):
		return Fund.objects.filter(owner=self.request.user)

	def perform_create(self, serializer):
		serializer.save(owner=self.request.user)


