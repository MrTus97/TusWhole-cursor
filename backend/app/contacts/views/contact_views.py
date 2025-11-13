from django.db import models as django_models
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from app.contacts.models import Contact
from app.contacts.serializers import ContactSerializer
from app.contacts.services import ContactService
from app.contacts.filtersets.contact_filterset import ContactFilterSet


CONTACT_SEARCH_FIELDS = [
    field.name
    for field in Contact._meta.get_fields()
    if getattr(field, "attname", None)
    and field.concrete
    and isinstance(field, (django_models.CharField, django_models.TextField))
]
CONTACT_SEARCH_FIELDS += ["owner__username", "owner__email"]


@extend_schema_view(
    list=extend_schema(tags=["Contacts"], summary="Danh sách liên hệ"),
    create=extend_schema(tags=["Contacts"], summary="Tạo liên hệ mới"),
    retrieve=extend_schema(tags=["Contacts"], summary="Chi tiết liên hệ"),
    update=extend_schema(tags=["Contacts"], summary="Cập nhật liên hệ"),
    partial_update=extend_schema(tags=["Contacts"], summary="Cập nhật một phần liên hệ"),
    destroy=extend_schema(tags=["Contacts"], summary="Xoá liên hệ"),
)
class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ContactSerializer
    filterset_class = ContactFilterSet
    ordering_fields = "__all__"
    search_fields = CONTACT_SEARCH_FIELDS

    def get_queryset(self):
        return ContactService.list_contacts(self.request.user)

    def create(self, request, *args, **kwargs):
        # Copy request.data để không ảnh hưởng đến original
        data = request.data.copy()
        custom_fields_data = data.pop("custom_fields", {})
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save(owner=request.user)
        
        # Lưu custom field values
        if custom_fields_data:
            from app.custom_fields.services import CustomFieldValueService
            # Convert string keys to int if needed
            custom_fields_dict = {}
            for key, value in custom_fields_data.items():
                try:
                    field_id = int(key)
                    custom_fields_dict[field_id] = value
                except (ValueError, TypeError):
                    continue
            if custom_fields_dict:
                CustomFieldValueService.set_values(contact, custom_fields_dict)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        # Copy request.data để không ảnh hưởng đến original
        data = request.data.copy()
        custom_fields_data = data.pop("custom_fields", {})
        
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save()
        
        # Lưu custom field values
        if custom_fields_data:
            from app.custom_fields.services import CustomFieldValueService
            # Convert string keys to int if needed
            custom_fields_dict = {}
            for key, value in custom_fields_data.items():
                try:
                    field_id = int(key)
                    custom_fields_dict[field_id] = value
                except (ValueError, TypeError):
                    continue
            if custom_fields_dict:
                CustomFieldValueService.set_values(contact, custom_fields_dict)
        
        return Response(serializer.data)

