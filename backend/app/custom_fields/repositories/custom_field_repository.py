from django.db.models import QuerySet

from app.custom_fields.models import CustomField


class CustomFieldRepository:
    @staticmethod
    def for_target_model(target_model: str) -> QuerySet[CustomField]:
        return CustomField.objects.filter(target_model=target_model, is_active=True).order_by(
            "order", "name"
        )

    @staticmethod
    def get_by_id(field_id: int) -> CustomField:
        return CustomField.objects.get(pk=field_id)

    @staticmethod
    def create(**kwargs) -> CustomField:
        return CustomField.objects.create(**kwargs)

    @staticmethod
    def update(custom_field: CustomField, **kwargs) -> CustomField:
        for field, value in kwargs.items():
            setattr(custom_field, field, value)
        custom_field.save()
        return custom_field

    @staticmethod
    def all() -> QuerySet[CustomField]:
        return CustomField.objects.all().order_by("target_model", "order", "name")

