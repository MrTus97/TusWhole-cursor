"""
Base FilterSet với các method chung để xử lý filter động
"""
from django_filters import rest_framework as filters
from django.db.models import Q


class DynamicFilterSet(filters.FilterSet):
    """Base FilterSet hỗ trợ filter động với các operators không chuẩn"""

    def filter_queryset(self, queryset):
        """
        Override để xử lý các filter động với format field__not__operator
        """
        # Filter với các filter chuẩn trước
        queryset = super().filter_queryset(queryset)

        # Xử lý các filter có format field__not__operator và một số lookup đặc biệt từ self.data
        if self.data:
            for key, value in self.data.items():
                if not value:
                    continue
                # not-operators
                if "__not__" in key:
                    parts = key.split("__not__")
                    if len(parts) == 2:
                        field_name = parts[0]
                        operator = parts[1]
                        if operator == "icontains":
                            queryset = queryset.exclude(
                                **{f"{field_name}__icontains": value})
                        elif operator == "exact":
                            queryset = queryset.exclude(**{field_name: value})
                        elif operator == "in":
                            values = [v.strip() for v in str(
                                value).split(",") if v.strip()]
                            queryset = queryset.exclude(
                                **{f"{field_name}__in": values})
                    continue
                # __isnull (hỗ trợ coi "" là rỗng đối với text)
                if key.endswith("__isnull"):
                    field_name = key[:-8]
                    bool_val = str(value).lower() in {"true", "1", "yes"}
                    try:
                        model_field = self._meta.model._meta.get_field(
                            field_name)
                    except Exception:
                        model_field = None
                    if bool_val:
                        if model_field and getattr(model_field, "empty_strings_allowed", False):
                            queryset = queryset.filter(
                                Q(**{f"{field_name}__isnull": True}) | Q(**{f"{field_name}__exact": ""}))
                        else:
                            queryset = queryset.filter(
                                **{f"{field_name}__isnull": True})
                    else:
                        if model_field and getattr(model_field, "empty_strings_allowed", False):
                            queryset = queryset.exclude(
                                Q(**{f"{field_name}__isnull": True}) | Q(**{f"{field_name}__exact": ""}))
                        else:
                            queryset = queryset.filter(
                                **{f"{field_name}__isnull": False})
                    continue
                # __in chung
                if key.endswith("__in"):
                    field_name = key[:-4]
                    values = [v.strip()
                              for v in str(value).split(",") if v.strip()]
                    queryset = queryset.filter(**{f"{field_name}__in": values})
                    continue

        return queryset
