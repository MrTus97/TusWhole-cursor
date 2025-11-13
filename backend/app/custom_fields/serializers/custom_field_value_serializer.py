from rest_framework import serializers

from app.custom_fields.models import CustomFieldValue


class CustomFieldValueSerializer(serializers.ModelSerializer):
    custom_field = serializers.PrimaryKeyRelatedField(read_only=True)
    custom_field_name = serializers.CharField(source="custom_field.name", read_only=True)
    custom_field_type = serializers.CharField(source="custom_field.field_type", read_only=True)
    value = serializers.SerializerMethodField()

    class Meta:
        model = CustomFieldValue
        fields = (
            "id",
            "custom_field",
            "custom_field_name",
            "custom_field_type",
            "value",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_value(self, obj):
        return obj.get_value()

