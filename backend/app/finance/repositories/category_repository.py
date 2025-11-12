from django.db.models import QuerySet

from app.finance.models import Category, Wallet


class CategoryRepository:
    @staticmethod
    def for_wallet(wallet: Wallet) -> QuerySet[Category]:
        return Category.objects.filter(wallet=wallet).select_related("parent", "template")

    @staticmethod
    def get_by_id(category_id: int) -> Category:
        return Category.objects.select_related("wallet", "parent", "template").get(pk=category_id)

    @staticmethod
    def create(**kwargs) -> Category:
        return Category.objects.create(**kwargs)

    @staticmethod
    def update(category: Category, **kwargs) -> Category:
        for field, value in kwargs.items():
            setattr(category, field, value)
        category.save()
        return category

    @staticmethod
    def active_for_wallet(wallet: Wallet) -> QuerySet[Category]:
        return CategoryRepository.for_wallet(wallet).filter(is_active=True)

