from rest_framework import serializers

from app.contacts.models import Contact


class ContactSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    custom_fields = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = (
            "id",
            "full_name",
            "nickname",
            "occupation",
            "current_address",
            "hometown",
            "phone_number",
            "importance",
            "date_of_birth",
            "notes",
            "created_at",
            "updated_at",
            "owner",
            "custom_fields",
        )
        read_only_fields = ("id", "created_at", "updated_at", "owner")

    def get_custom_fields(self, obj):
        """Lấy các custom field values cho contact này"""
        from django.contrib.contenttypes.models import ContentType
        from app.custom_fields.models import CustomFieldValue
        from app.custom_fields.serializers import CustomFieldValueSerializer

        content_type = ContentType.objects.get_for_model(obj)
        values = CustomFieldValue.objects.filter(
            content_type=content_type, object_id=obj.id
        ).select_related("custom_field")
        return CustomFieldValueSerializer(values, many=True).data

