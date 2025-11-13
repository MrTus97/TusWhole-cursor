import django_filters
from django_filters import rest_framework as filters

from app.finance.models import Transaction
from app.finance.filtersets.base_filterset import DynamicFilterSet


class TransactionFilterSet(DynamicFilterSet):
    # Text filters
    note__icontains = django_filters.CharFilter(field_name="note", lookup_expr="icontains")
    note__istartswith = django_filters.CharFilter(field_name="note", lookup_expr="istartswith")
    note__iendswith = django_filters.CharFilter(field_name="note", lookup_expr="iendswith")
    note__not__icontains = django_filters.CharFilter(method="filter_not_icontains")
    
    # Number filters
    amount__gt = django_filters.NumberFilter(field_name="amount", lookup_expr="gt")
    amount__lt = django_filters.NumberFilter(field_name="amount", lookup_expr="lt")
    amount__gte = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
    amount__lte = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")
    amount__not__exact = django_filters.NumberFilter(method="filter_not_exact")
    
    # DateTime filters
    occurred_at__gte = django_filters.DateTimeFilter(field_name="occurred_at", lookup_expr="gte")
    occurred_at__lte = django_filters.DateTimeFilter(field_name="occurred_at", lookup_expr="lte")
    occurred_at__gt = django_filters.DateTimeFilter(field_name="occurred_at", lookup_expr="gt")
    occurred_at__lt = django_filters.DateTimeFilter(field_name="occurred_at", lookup_expr="lt")
    
    def filter_not_icontains(self, queryset, name, value):
        field_name = name.split("__")[0]
        return queryset.exclude(**{f"{field_name}__icontains": value})
    
    def filter_not_exact(self, queryset, name, value):
        field_name = name.split("__")[0]
        return queryset.exclude(**{field_name: value})

    class Meta:
        model = Transaction
        fields = {
            "wallet": ["exact"],
            "category": ["exact"],
            "transaction_type": ["exact"],
            "amount": ["exact", "gte", "lte", "gt", "lt"],
            "note": ["exact", "icontains"],
            "occurred_at": ["exact", "gte", "lte", "gt", "lt"],
        }
        exclude = ["metadata", "created_at", "updated_at"]

