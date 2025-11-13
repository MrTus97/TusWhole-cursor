from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


class JournalHashtag(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="journal_hashtags",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=60, verbose_name="Hashtag")
    normalized_name = models.CharField(
        max_length=80,
        editable=False,
        verbose_name="Hashtag chuẩn hoá",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["owner", "normalized_name"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "normalized_name"],
                name="journal_hashtag_unique_per_owner",
            )
        ]
        verbose_name = "Hashtag nhật ký"
        verbose_name_plural = "Hashtag nhật ký"

    def __str__(self) -> str:
        return f"#{self.name}"

    @property
    def display_name(self) -> str:
        return f"#{self.name}"

    @staticmethod
    def normalize(raw_value: str) -> str:
        base = (raw_value or "").strip().lstrip("#")
        if not base:
            return ""
        return slugify(base, allow_unicode=True)

    def clean(self) -> None:
        super().clean()
        normalized = self.normalize(self.name)
        if not normalized:
            raise ValidationError("Hashtag không được để trống.")
        self.name = normalized
        self.normalized_name = normalized

    def save(self, *args, **kwargs):
        self.clean()
        return super().save(*args, **kwargs)


