from rest_framework import serializers

from app.finance.models import Wallet, Fund


class WalletSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    fund = serializers.PrimaryKeyRelatedField(
        queryset=Fund.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Wallet
        fields = (
            "id",
            "fund",
            "name",
            "description",
            "currency",
            "initial_balance",
            "current_balance",
            "created_at",
            "updated_at",
            "owner",
        )
        read_only_fields = ("id", "current_balance", "created_at", "updated_at", "owner")

