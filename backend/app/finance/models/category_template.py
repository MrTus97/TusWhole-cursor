from django.db import models
from django.utils.translation import gettext_lazy as _

from app.finance.models.choices import TransactionType


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

