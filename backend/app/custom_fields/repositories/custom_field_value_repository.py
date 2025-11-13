from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet

from app.custom_fields.models import CustomFieldValue


class CustomFieldValueRepository:
    @staticmethod
    def for_object(content_object) -> QuerySet[CustomFieldValue]:
        content_type = ContentType.objects.get_for_model(content_object)
        return CustomFieldValue.objects.filter(
            content_type=content_type, object_id=content_object.pk
        )

    @staticmethod
    def get_or_create(custom_field, content_object, defaults=None):
        from django.contrib.contenttypes.models import ContentType

        content_type = ContentType.objects.get_for_model(content_object)
        return CustomFieldValue.objects.get_or_create(
            custom_field=custom_field,
            content_type=content_type,
            object_id=content_object.pk,
            defaults=defaults or {},
        )

    @staticmethod
    def update_or_create(custom_field, content_object, defaults):
        from django.contrib.contenttypes.models import ContentType

        content_type = ContentType.objects.get_for_model(content_object)
        return CustomFieldValue.objects.update_or_create(
            custom_field=custom_field,
            content_type=content_type,
            object_id=content_object.pk,
            defaults=defaults,
        )

