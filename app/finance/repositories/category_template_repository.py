from django.db.models import QuerySet

from app.finance.models import CategoryTemplate


class CategoryTemplateRepository:
    @staticmethod
    def all_master() -> QuerySet[CategoryTemplate]:
        return CategoryTemplate.objects.select_related("parent").all()

    @staticmethod
    def by_transaction_type(transaction_type: str) -> QuerySet[CategoryTemplate]:
        return CategoryTemplate.objects.filter(transaction_type=transaction_type)

    @staticmethod
    def roots() -> QuerySet[CategoryTemplate]:
        return CategoryTemplate.objects.filter(parent__isnull=True)

    @staticmethod
    def create(**kwargs) -> CategoryTemplate:
        return CategoryTemplate.objects.create(**kwargs)

