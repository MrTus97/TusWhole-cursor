from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class TransactionType(models.TextChoices):
    INCOME = "INCOME", _("Thu")
    EXPENSE = "EXPENSE", _("Chi")
    LEND = "LEND", _("Cho vay")
    BORROW = "BORROW", _("Đi vay")


class Wallet(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallets",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    currency = models.CharField(max_length=5, default="VND")
    initial_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("owner", "name")
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.owner})"

    def save(self, *args, **kwargs):
        if self._state.adding and self.current_balance in {0, Decimal("0")}:
            self.current_balance = self.initial_balance
        super().save(*args, **kwargs)


class CategoryTemplate(models.Model):
    name = models.CharField(max_length=100)
    transaction_type = models.CharField(
        max_length=20, choices=TransactionType.choices, default=TransactionType.EXPENSE
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )
    description = models.TextField(blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["transaction_type", "position", "name"]
        verbose_name = _("Master category template")
        verbose_name_plural = _("Master category templates")

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    wallet = models.ForeignKey(
        Wallet, on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=100)
    transaction_type = models.CharField(
        max_length=20, choices=TransactionType.choices
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )
    template = models.ForeignKey(
        CategoryTemplate,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="materialized_categories",
    )
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("wallet", "name", "transaction_type")
        ordering = ["wallet", "transaction_type", "name"]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        if self.parent and self.parent.wallet_id != self.wallet_id:
            raise ValidationError(_("Parent category phải thuộc cùng một ví."))
        if self.parent and self.parent.transaction_type != self.transaction_type:
            raise ValidationError(_("Parent category phải cùng loại giao dịch."))


class Transaction(models.Model):
    wallet = models.ForeignKey(
        Wallet, on_delete=models.CASCADE, related_name="transactions"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=20, choices=TransactionType.choices
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    note = models.TextField(blank=True)
    occurred_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(blank=True, default=dict)

    class Meta:
        ordering = ["-occurred_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.wallet.name} - {self.amount} ({self.transaction_type})"

    def clean(self):
        if self.category.wallet_id != self.wallet_id:
            raise ValidationError(_("Category của giao dịch phải thuộc cùng ví."))
        if self.category.transaction_type != self.transaction_type:
            raise ValidationError(_("Loại giao dịch không khớp với category."))

    def save(self, *args, **kwargs):
        if not self.transaction_type:
            self.transaction_type = self.category.transaction_type
        self.full_clean()
        super().save(*args, **kwargs)
