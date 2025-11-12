from rest_framework import serializers

from app.finance.models import Category, Transaction, TransactionType, Wallet


class TransactionSerializer(serializers.ModelSerializer):
    wallet = serializers.PrimaryKeyRelatedField(queryset=Wallet.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    transaction_type = serializers.ChoiceField(
        choices=TransactionType.choices, required=False, allow_null=True
    )

    class Meta:
        model = Transaction
        fields = (
            "id",
            "wallet",
            "category",
            "transaction_type",
            "amount",
            "note",
            "occurred_at",
            "created_at",
            "updated_at",
            "metadata",
        )
        read_only_fields = ("id", "created_at", "updated_at")

