import django_filters
from django_filters import rest_framework as filters

from app.finance.filtersets.base_filterset import DynamicFilterSet
from app.journal.models import JournalEntry, JournalHashtag


class JournalEntryFilterSet(DynamicFilterSet):
    title__icontains = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    content__icontains = django_filters.CharFilter(field_name="content_text", lookup_expr="icontains")
    written_at__date = django_filters.DateFilter(field_name="written_at", lookup_expr="date")
    written_at__date__gte = django_filters.DateFilter(field_name="written_at", lookup_expr="date__gte")
    written_at__date__lte = django_filters.DateFilter(field_name="written_at", lookup_expr="date__lte")
    hashtags = filters.CharFilter(method="filter_hashtags")

    def filter_hashtags(self, queryset, name, value):
        if not value:
            return queryset
        normalized = []
        for part in value.split(","):
            cleaned = JournalHashtag.normalize(part)
            if cleaned:
                normalized.append(cleaned)
        if not normalized:
            return queryset
        return queryset.filter(hashtags__normalized_name__in=normalized).distinct()

    class Meta:
        model = JournalEntry
        fields = {
            "written_at": ["exact", "gte", "lte"],
            "created_at": ["exact", "gte", "lte"],
        }

