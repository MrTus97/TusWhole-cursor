from rest_framework import serializers

from app.finance.models import Category, CategoryTemplate, TransactionType


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )
    template = serializers.PrimaryKeyRelatedField(
        queryset=CategoryTemplate.objects.all(), allow_null=True, required=False
    )
    transaction_type = serializers.ChoiceField(choices=TransactionType.choices)

    class Meta:
        model = Category
        fields = (
            "id",
            "wallet",
            "name",
            "transaction_type",
            "parent",
            "template",
            "description",
            "icon",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

