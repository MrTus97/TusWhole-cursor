from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from app.custom_fields.models.custom_field import CustomField


class CustomFieldValue(models.Model):
    custom_field = models.ForeignKey(
        CustomField,
        on_delete=models.CASCADE,
        related_name="values",
        verbose_name="Custom Field",
    )
    # Generic foreign key để liên kết với bất kỳ model nào
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Lưu giá trị dưới dạng text, có thể parse lại theo field_type
    value_text = models.TextField(blank=True, verbose_name="Giá trị (text)")
    value_number = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True, verbose_name="Giá trị (số)"
    )
    value_date = models.DateField(null=True, blank=True, verbose_name="Giá trị (ngày)")
    value_datetime = models.DateTimeField(
        null=True, blank=True, verbose_name="Giá trị (datetime)"
    )
    value_boolean = models.BooleanField(
        null=True, blank=True, verbose_name="Giá trị (boolean)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("custom_field", "content_type", "object_id")]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["custom_field", "content_type", "object_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.custom_field.name}: {self.get_value()}"

    def get_value(self):
        """Trả về giá trị theo đúng kiểu dữ liệu của custom_field"""
        field_type = self.custom_field.field_type

        if field_type == "text" or field_type == "textarea":
            return self.value_text
        elif field_type == "number":
            return self.value_number
        elif field_type == "date":
            return self.value_date
        elif field_type == "datetime":
            return self.value_datetime
        elif field_type == "boolean" or field_type == "checkbox":
            return self.value_boolean
        elif field_type == "dropdown" or field_type == "radio":
            return self.value_text
        else:
            return self.value_text

    def set_value(self, value):
        """Set giá trị và tự động lưu vào đúng field tương ứng"""
        field_type = self.custom_field.field_type

        if field_type == "text" or field_type == "textarea" or field_type == "dropdown" or field_type == "radio":
            self.value_text = str(value) if value is not None else ""
            self.value_number = None
            self.value_date = None
            self.value_datetime = None
            self.value_boolean = None
        elif field_type == "number":
            self.value_number = value
            self.value_text = str(value) if value is not None else ""
            self.value_date = None
            self.value_datetime = None
            self.value_boolean = None
        elif field_type == "date":
            self.value_date = value
            self.value_text = str(value) if value is not None else ""
            self.value_number = None
            self.value_datetime = None
            self.value_boolean = None
        elif field_type == "datetime":
            self.value_datetime = value
            self.value_text = str(value) if value is not None else ""
            self.value_number = None
            self.value_date = None
            self.value_boolean = None
        elif field_type == "boolean" or field_type == "checkbox":
            self.value_boolean = bool(value) if value is not None else None
            self.value_text = str(value) if value is not None else ""
            self.value_number = None
            self.value_date = None
            self.value_datetime = None

