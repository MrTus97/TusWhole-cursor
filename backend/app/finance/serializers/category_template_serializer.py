from rest_framework import serializers

from app.finance.models import CategoryTemplate


class CategoryTemplateSerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(
        queryset=CategoryTemplate.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = CategoryTemplate
        fields = (
            "id",
            "name",
            "transaction_type",
            "description",
            "position",
            "parent",
        )
        read_only_fields = ("id",)

