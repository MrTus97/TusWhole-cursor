from django.conf import settings
from django.db import models

from app.contacts.models.choices import ImportanceLevel


class Contact(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contacts",
    )
    full_name = models.CharField(max_length=200, verbose_name="Họ và tên")
    nickname = models.CharField(
        max_length=100, blank=True, verbose_name="Biệt danh")
    # Liên kết tới bảng category_occupation (Occupation)
    occupation = models.ForeignKey(
        "categories.Occupation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="contacts",
        verbose_name="Ngành nghề",
    )
    current_address = models.TextField(
        blank=True, verbose_name="Chỗ ở hiện tại")
    hometown = models.CharField(
        max_length=200, blank=True, verbose_name="Quê quán")
    phone_number = models.CharField(
        max_length=20, blank=True, verbose_name="Số điện thoại")
    importance = models.CharField(
        max_length=20,
        choices=ImportanceLevel.choices,
        default=ImportanceLevel.MEDIUM,
        verbose_name="Độ quan trọng",
    )
    date_of_birth = models.DateField(
        null=True, blank=True, verbose_name="Ngày sinh")
    notes = models.TextField(blank=True, verbose_name="Ghi chú")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-importance", "full_name"]
        indexes = [
            models.Index(fields=["owner", "full_name"]),
            models.Index(fields=["owner", "importance"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.owner})"
