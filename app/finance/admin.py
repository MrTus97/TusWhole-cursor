from django.contrib import admin

from app.finance import models


@admin.register(models.Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "currency", "current_balance", "created_at")
    search_fields = ("name", "owner__username")
    list_filter = ("currency",)


@admin.register(models.CategoryTemplate)
class CategoryTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "transaction_type", "parent", "position")
    list_filter = ("transaction_type",)
    search_fields = ("name",)
    ordering = ("transaction_type", "position", "name")


@admin.register(models.Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "wallet", "transaction_type", "parent", "is_active")
    list_filter = ("transaction_type", "wallet")
    search_fields = ("name", "wallet__name", "wallet__owner__username")


@admin.register(models.Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("wallet", "category", "transaction_type", "amount", "occurred_at")
    list_filter = ("transaction_type", "wallet")
    search_fields = ("wallet__name", "category__name", "note")
    date_hierarchy = "occurred_at"
