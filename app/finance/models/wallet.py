from decimal import Decimal

from django.conf import settings
from django.db import models


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

