from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from app.finance.models.category import Category
from app.finance.models.choices import TransactionType
from app.finance.models.wallet import Wallet


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

