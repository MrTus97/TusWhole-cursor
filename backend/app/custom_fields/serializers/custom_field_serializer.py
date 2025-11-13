from rest_framework import serializers

from app.custom_fields.models import CustomField


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = (
            "id",
            "name",
            "description",
            "field_type",
            "target_model",
            "min_length",
            "max_length",
            "default_value",
            "is_required",
            "is_searchable",
            "is_filterable",
            "options",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

