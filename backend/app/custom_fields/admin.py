from django.contrib import admin

from app.custom_fields.models import CustomField, CustomFieldValue


@admin.register(CustomField)
class CustomFieldAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "target_model",
        "field_type",
        "is_required",
        "is_searchable",
        "is_filterable",
        "order",
        "is_active",
        "created_at",
    ]
    list_filter = ["target_model", "field_type", "is_active", "is_required"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": ("name", "description", "target_model", "field_type", "order")
        }),
        ("Cấu hình", {
            "fields": (
                "min_length",
                "max_length",
                "default_value",
                "options",
                "is_required",
                "is_searchable",
                "is_filterable",
                "is_active",
            )
        }),
        ("Thông tin hệ thống", {
            "fields": ("created_at", "updated_at")
        }),
    )


@admin.register(CustomFieldValue)
class CustomFieldValueAdmin(admin.ModelAdmin):
    list_display = [
        "custom_field",
        "content_type",
        "object_id",
        "get_value_display",
        "created_at",
    ]
    list_filter = ["custom_field", "content_type", "created_at"]
    search_fields = ["custom_field__name", "value_text"]
    readonly_fields = ["created_at", "updated_at"]

    def get_value_display(self, obj):
        return obj.get_value()

    get_value_display.short_description = "Giá trị"
