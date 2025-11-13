from django.db import models


class ImportanceLevel(models.TextChoices):
    LOW = "low", "Thấp"
    MEDIUM = "medium", "Trung bình"
    HIGH = "high", "Cao"
    VERY_HIGH = "very_high", "Rất cao"

