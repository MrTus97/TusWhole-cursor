from app.custom_fields.models import CustomField
from app.custom_fields.repositories import CustomFieldRepository


class CustomFieldService:
    @staticmethod
    def create_custom_field(**data) -> CustomField:
        return CustomFieldRepository.create(**data)

    @staticmethod
    def list_custom_fields(target_model: str = None):
        if target_model:
            return CustomFieldRepository.for_target_model(target_model)
        return CustomFieldRepository.all()

    @staticmethod
    def update_custom_field(custom_field: CustomField, **data) -> CustomField:
        return CustomFieldRepository.update(custom_field, **data)

