from django.db import transaction

from app.finance.models import Category, Wallet
from app.finance.repositories import CategoryRepository, CategoryTemplateRepository


class CategoryService:
    @staticmethod
    def list_categories(wallet: Wallet):
        return CategoryRepository.for_wallet(wallet)

    @staticmethod
    def create_category(wallet: Wallet, **data) -> Category:
        return CategoryRepository.create(wallet=wallet, **data)

    @staticmethod
    @transaction.atomic
    def bootstrap_from_master(wallet: Wallet) -> None:
        if CategoryRepository.for_wallet(wallet).exists():
            return

        template_map = {}
        templates = (
            CategoryTemplateRepository.all_master()
            .order_by("parent__id", "transaction_type", "position", "name")
        )

        for template in templates:
            parent_category = template_map.get(template.parent_id)
            category = CategoryRepository.create(
                wallet=wallet,
                name=template.name,
                transaction_type=template.transaction_type,
                parent=parent_category,
                template=template,
                description=template.description,
            )
            template_map[template.id] = category

