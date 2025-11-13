from django.contrib import admin

from app.categories.models import Occupation


@admin.register(Occupation)
class OccupationAdmin(admin.ModelAdmin):
	list_display = ["name", "parent", "is_active", "created_at"]
	list_filter = ["is_active", "created_at"]
	search_fields = ["name", "parent__name", "description"]
	autocomplete_fields = ["parent"]
	readonly_fields = ["created_at", "updated_at"]


