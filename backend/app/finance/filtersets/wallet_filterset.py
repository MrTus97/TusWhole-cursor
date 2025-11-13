import django_filters
from django.db.models import Q
from django_filters import rest_framework as filters

from app.finance.models import Wallet
from app.finance.filtersets.base_filterset import DynamicFilterSet


class WalletFilterSet(DynamicFilterSet):
    # Text filters
    name__icontains = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    name__istartswith = django_filters.CharFilter(field_name="name", lookup_expr="istartswith")
    name__iendswith = django_filters.CharFilter(field_name="name", lookup_expr="iendswith")
    name__not__icontains = django_filters.CharFilter(method="filter_not_icontains")
    description__icontains = django_filters.CharFilter(field_name="description", lookup_expr="icontains")
    
    # Number filters
    current_balance__gt = django_filters.NumberFilter(field_name="current_balance", lookup_expr="gt")
    current_balance__lt = django_filters.NumberFilter(field_name="current_balance", lookup_expr="lt")
    current_balance__gte = django_filters.NumberFilter(field_name="current_balance", lookup_expr="gte")
    current_balance__lte = django_filters.NumberFilter(field_name="current_balance", lookup_expr="lte")
    
    # Date filters
    created_at__gte = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    created_at__lte = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")
    created_at__gt = django_filters.DateFilter(field_name="created_at", lookup_expr="gt")
    created_at__lt = django_filters.DateFilter(field_name="created_at", lookup_expr="lt")

    def filter_not_icontains(self, queryset, name, value):
        # Extract field name from filter name (e.g., "name__not__icontains" -> "name")
        field_name = name.split("__")[0]
        return queryset.exclude(**{f"{field_name}__icontains": value})
    
    def filter_not_exact(self, queryset, name, value):
        field_name = name.split("__")[0]
        return queryset.exclude(**{field_name: value})

    class Meta:
        model = Wallet
        fields = {
            "name": ["exact"],
            "currency": ["exact"],
            "current_balance": ["exact", "gte", "lte", "gt", "lt"],
            "created_at": ["exact", "gte", "lte", "gt", "lt"],
        }
