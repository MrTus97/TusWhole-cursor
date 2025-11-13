from app.custom_fields.models import CustomFieldValue
from app.custom_fields.repositories import CustomFieldValueRepository


class CustomFieldValueService:
    @staticmethod
    def get_values_for_object(content_object):
        return CustomFieldValueRepository.for_object(content_object)

    @staticmethod
    def set_value(custom_field, content_object, value) -> CustomFieldValue:
        field_value, created = CustomFieldValueRepository.get_or_create(
            custom_field, content_object
        )
        field_value.set_value(value)
        field_value.save()
        return field_value

    @staticmethod
    def set_values(content_object, values_dict):
        """Set nhiều giá trị cùng lúc
        values_dict: {custom_field_id: value, ...}
        """
        from app.custom_fields.models import CustomField

        results = []
        for field_id, value in values_dict.items():
            try:
                custom_field = CustomField.objects.get(pk=field_id)
                field_value = CustomFieldValueService.set_value(
                    custom_field, content_object, value
                )
                results.append(field_value)
            except CustomField.DoesNotExist:
                continue
        return results

