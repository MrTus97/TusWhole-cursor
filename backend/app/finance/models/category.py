from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from app.finance.models.category_template import CategoryTemplate
from app.finance.models.choices import TransactionType
from app.finance.models.wallet import Wallet


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

