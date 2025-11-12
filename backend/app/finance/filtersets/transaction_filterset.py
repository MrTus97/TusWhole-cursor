import django_filters
from django_filters import rest_framework as filters

from app.finance.models import Transaction


class TransactionFilterSet(filters.FilterSet):
    class Meta:
        model = Transaction
        fields = {
            "wallet": ["exact"],
            "category": ["exact"],
            "transaction_type": ["exact"],
            "amount": ["exact", "gte", "lte", "gt", "lt"],
            "note": ["icontains"],
            "occurred_at": ["exact", "gte", "lte", "gt", "lt"],
        }
        exclude = ["metadata", "created_at", "updated_at"]

