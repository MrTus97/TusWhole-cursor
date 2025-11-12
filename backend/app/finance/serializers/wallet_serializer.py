from rest_framework import serializers

from app.finance.models import Wallet


class WalletSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Wallet
        fields = (
            "id",
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

