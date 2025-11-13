from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.categories.models import Occupation
from app.categories.serializers import OccupationSerializer
from app.categories.services import OccupationService


@extend_schema_view(
	list=extend_schema(tags=["Categories - Occupations"], summary="Danh sách ngành nghề"),
	create=extend_schema(tags=["Categories - Occupations"], summary="Tạo ngành nghề"),
	retrieve=extend_schema(tags=["Categories - Occupations"], summary="Chi tiết ngành nghề"),
	update=extend_schema(tags=["Categories - Occupations"], summary="Cập nhật ngành nghề"),
	partial_update=extend_schema(tags=["Categories - Occupations"], summary="Cập nhật một phần ngành nghề"),
	destroy=extend_schema(tags=["Categories - Occupations"], summary="Xoá ngành nghề"),
)
class OccupationViewSet(viewsets.ModelViewSet):
	permission_classes = [IsAuthenticated]
	serializer_class = OccupationSerializer
	filterset_fields = "__all__"
	ordering_fields = "__all__"
	search_fields = ["name", "parent__name", "description"]

	def get_queryset(self):
		queryset = OccupationService.list_occupations()
		search = self.request.query_params.get("search")
		if search:
			return queryset.filter(name__icontains=search)
		return queryset

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		obj = OccupationService.create_occupation(**serializer.validated_data)
		output_serializer = self.get_serializer(obj)
		headers = self.get_success_headers(output_serializer.data)
		return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


