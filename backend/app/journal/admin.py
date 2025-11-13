from django.contrib import admin

from app.journal.models import JournalEntry, JournalHashtag


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "written_at", "created_at"]
    list_filter = ["written_at", "created_at", "owner"]
    search_fields = ["title", "content_text", "hashtags__name"]
    readonly_fields = ["created_at", "updated_at", "content_text"]
    autocomplete_fields = ["hashtags"]
    fieldsets = (
        (
            "Thông tin nhật ký",
            {"fields": ("owner", "title", "content", "written_at", "hashtags")},
        ),
        (
            "Thông tin hệ thống",
            {"fields": ("created_at", "updated_at", "content_text")},
        ),
    )


@admin.register(JournalHashtag)
class JournalHashtagAdmin(admin.ModelAdmin):
    list_display = ["display_name", "owner", "created_at"]
    search_fields = ["name", "owner__username", "owner__email"]
    list_filter = ["owner"]
    readonly_fields = ["created_at", "normalized_name"]


