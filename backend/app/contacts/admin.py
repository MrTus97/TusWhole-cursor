from django.contrib import admin

from app.contacts.models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ["full_name", "nickname", "phone_number", "importance", "owner", "created_at"]
    list_filter = ["importance", "created_at", "owner"]
    search_fields = ["full_name", "nickname", "phone_number", "occupation"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": ("owner", "full_name", "nickname", "phone_number", "date_of_birth")
        }),
        ("Thông tin chi tiết", {
            "fields": ("occupation", "current_address", "hometown", "importance", "notes")
        }),
        ("Thông tin hệ thống", {
            "fields": ("created_at", "updated_at")
        }),
    )
