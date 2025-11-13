from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from app.journal.models.hashtag import JournalHashtag


class JournalEntry(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="journal_entries",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255, blank=True, verbose_name="Tiêu đề")
    content = models.TextField(verbose_name="Nội dung (HTML)")
    content_text = models.TextField(blank=True, verbose_name="Nội dung dạng văn bản")
    written_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Thời điểm viết",
    )
    hashtags = models.ManyToManyField(
        JournalHashtag,
        related_name="entries",
        blank=True,
        verbose_name="Hashtag",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-written_at", "-created_at"]
        indexes = [
            models.Index(fields=["owner", "written_at"]),
            models.Index(fields=["owner", "created_at"]),
        ]
        verbose_name = "Nhật ký"
        verbose_name_plural = "Nhật ký"

    def __str__(self) -> str:
        title = self.title or self.content_text[:20] or self.content[:20]
        return f"{title} - {self.owner}"


