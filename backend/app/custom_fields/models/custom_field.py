from django.db import models

from app.custom_fields.models.choices import FieldType, TargetModel


class CustomField(models.Model):
    name = models.CharField(max_length=200, verbose_name="Tên field")
    description = models.TextField(blank=True, verbose_name="Mô tả")
    field_type = models.CharField(
        max_length=20,
        choices=FieldType.choices,
        verbose_name="Loại field",
    )
    target_model = models.CharField(
        max_length=50,
        choices=TargetModel.choices,
        verbose_name="Model đích",
    )
    min_length = models.IntegerField(null=True, blank=True, verbose_name="Độ dài tối thiểu")
    max_length = models.IntegerField(null=True, blank=True, verbose_name="Độ dài tối đa")
    default_value = models.TextField(blank=True, verbose_name="Giá trị mặc định")
    is_required = models.BooleanField(default=False, verbose_name="Bắt buộc")
    is_searchable = models.BooleanField(default=False, verbose_name="Có thể tìm kiếm")
    is_filterable = models.BooleanField(default=False, verbose_name="Có thể lọc")
    # Cho dropdown, checkbox, radio
    options = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Các tùy chọn (cho dropdown/checkbox/radio)",
        help_text="Danh sách các giá trị có thể chọn",
    )
    order = models.IntegerField(default=0, verbose_name="Thứ tự hiển thị")
    is_active = models.BooleanField(default=True, verbose_name="Đang hoạt động")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["target_model", "order", "name"]
        unique_together = [("target_model", "name")]
        indexes = [
            models.Index(fields=["target_model", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_target_model_display()})"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Validate options cho dropdown/checkbox/radio
        if self.field_type in [FieldType.DROPDOWN, FieldType.CHECKBOX, FieldType.RADIO]:
            if not self.options or len(self.options) == 0:
                raise ValidationError(
                    f"Field type {self.get_field_type_display()} yêu cầu ít nhất một option."
                )

        # Validate min/max length
        if self.min_length is not None and self.max_length is not None:
            if self.min_length > self.max_length:
                raise ValidationError("Min length không thể lớn hơn max length.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

