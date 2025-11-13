"""
Base FilterSet với các method chung để xử lý filter động
"""
from django_filters import rest_framework as filters


class DynamicFilterSet(filters.FilterSet):
    """Base FilterSet hỗ trợ filter động với các operators không chuẩn"""
    
    def filter_queryset(self, queryset):
        """
        Override để xử lý các filter động với format field__not__operator
        """
        # Filter với các filter chuẩn trước
        queryset = super().filter_queryset(queryset)
        
        # Xử lý các filter có format field__not__operator từ self.data
        if self.data:
            for key, value in self.data.items():
                if value and "__not__" in key:
                    parts = key.split("__not__")
                    if len(parts) == 2:
                        field_name = parts[0]
                        operator = parts[1]
                        
                        if operator == "icontains":
                            queryset = queryset.exclude(**{f"{field_name}__icontains": value})
                        elif operator == "exact":
                            queryset = queryset.exclude(**{field_name: value})
        
        return queryset

