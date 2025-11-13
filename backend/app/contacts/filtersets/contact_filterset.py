import django_filters
from django_filters import rest_framework as filters

from app.contacts.models import Contact
from app.finance.filtersets.base_filterset import DynamicFilterSet


class ContactFilterSet(DynamicFilterSet):
    # Text filters
    full_name__icontains = django_filters.CharFilter(field_name="full_name", lookup_expr="icontains")
    full_name__istartswith = django_filters.CharFilter(field_name="full_name", lookup_expr="istartswith")
    full_name__iendswith = django_filters.CharFilter(field_name="full_name", lookup_expr="iendswith")
    full_name__not__icontains = django_filters.CharFilter(method="filter_not_icontains")
    nickname__icontains = django_filters.CharFilter(field_name="nickname", lookup_expr="icontains")
    occupation__icontains = django_filters.CharFilter(field_name="occupation__name", lookup_expr="icontains")
    occupation__in = django_filters.CharFilter(method="filter_occupation_in")
    occupation__not__in = django_filters.CharFilter(method="filter_occupation_not_in")
    phone_number__icontains = django_filters.CharFilter(field_name="phone_number", lookup_expr="icontains")
    hometown__icontains = django_filters.CharFilter(field_name="hometown", lookup_expr="icontains")
    current_address__icontains = django_filters.CharFilter(field_name="current_address", lookup_expr="icontains")
    
    # Date filters
    date_of_birth__gte = django_filters.DateFilter(field_name="date_of_birth", lookup_expr="gte")
    date_of_birth__lte = django_filters.DateFilter(field_name="date_of_birth", lookup_expr="lte")
    date_of_birth__gt = django_filters.DateFilter(field_name="date_of_birth", lookup_expr="gt")
    date_of_birth__lt = django_filters.DateFilter(field_name="date_of_birth", lookup_expr="lt")
    created_at__gte = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    created_at__lte = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")

    def filter_not_icontains(self, queryset, name, value):
        # Extract field name from filter name (e.g., "full_name__not__icontains" -> "full_name")
        field_name = name.split("__")[0]
        return queryset.exclude(**{f"{field_name}__icontains": value})
    
    def filter_not_exact(self, queryset, name, value):
        field_name = name.split("__")[0]
        return queryset.exclude(**{field_name: value})
	
    def filter_occupation_in(self, queryset, name, value):
        values = [v.strip() for v in str(value).split(",") if v.strip()]
        ids = []
        for v in values:
            try:
                ids.append(int(v))
            except ValueError:
                continue
        if not ids:
            return queryset.none()
        return queryset.filter(occupation_id__in=ids)
    
    def filter_occupation_not_in(self, queryset, name, value):
        values = [v.strip() for v in str(value).split(",") if v.strip()]
        ids = []
        for v in values:
            try:
                ids.append(int(v))
            except ValueError:
                continue
        if not ids:
            return queryset
        return queryset.exclude(occupation_id__in=ids)

    class Meta:
        model = Contact
        fields = {
            "full_name": ["exact"],
            "nickname": ["exact"],
            "occupation": ["exact"],
            "phone_number": ["exact"],
            "importance": ["exact"],
            "date_of_birth": ["exact", "gte", "lte", "gt", "lt"],
            "hometown": ["exact"],
            "created_at": ["exact", "gte", "lte"],
        }
