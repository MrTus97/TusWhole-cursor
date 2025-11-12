from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from app.finance.models import TransactionType, Wallet
from app.finance.services import CategoryService, TransactionService, WalletService
from app.finance.repositories import CategoryTemplateRepository
from app.finance.models.category_template import CategoryTemplate


MASTER_CATEGORIES = [
    {
        "name": "Chi tiêu thiết yếu",
        "transaction_type": TransactionType.EXPENSE,
        "children": [
            {"name": "Ăn uống", "children": [{"name": "Đi chợ"}, {"name": "Ăn nhà hàng"}]},
            {"name": "Học hành"},
            {"name": "Đi lại"},
        ],
    },
    {
        "name": "Chi tiêu giải trí",
        "transaction_type": TransactionType.EXPENSE,
        "children": [
            {"name": "Mua sắm"},
            {"name": "Du lịch"},
        ],
    },
    {
        "name": "Thu nhập cố định",
        "transaction_type": TransactionType.INCOME,
        "children": [
            {"name": "Lương"},
            {"name": "Thưởng"},
        ],
    },
    {
        "name": "Quan hệ vay mượn",
        "transaction_type": TransactionType.LEND,
        "children": [
            {"name": "Cho bạn bè vay"},
            {"name": "Cho gia đình vay"},
        ],
    },
    {
        "name": "Vay nợ",
        "transaction_type": TransactionType.BORROW,
        "children": [
            {"name": "Vay ngân hàng"},
            {"name": "Mượn bạn bè"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed dữ liệu mẫu cho ứng dụng tài chính cá nhân"

    def handle(self, *args, **options):
        user = self._ensure_demo_user()
        self.stdout.write(self.style.SUCCESS(f"Su dung nguoi dung: {user.username} / demo1234"))

        with transaction.atomic():
            self._seed_master_categories()
            wallet = self._ensure_demo_wallet(user)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Vi mau ID {wallet.id} (so du hien tai: {wallet.current_balance})"
                )
            )
            self._ensure_sample_transactions(wallet)

        self.stdout.write(self.style.SUCCESS("Hoan tat seed du lieu tai chinh."))

    def _ensure_demo_user(self):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"},
        )
        if created:
            user.set_password("demo1234")
            user.first_name = "Demo"
            user.last_name = "User"
            user.save()
        elif not user.has_usable_password():
            user.set_password("demo1234")
            user.save()
        return user

    def _seed_master_categories(self):
        if CategoryTemplateRepository.all_master().exists():
            return

        self.stdout.write("Tao master category templates...")

        def create_templates(definitions, parent=None, position=0):
            for idx, definition in enumerate(definitions):
                transaction_type = definition.get("transaction_type")
                if transaction_type is None and parent is not None:
                    transaction_type = parent.transaction_type
                transaction_type = transaction_type or TransactionType.EXPENSE

                obj, _ = CategoryTemplate.objects.get_or_create(
                    name=definition["name"],
                    transaction_type=transaction_type,
                    parent=parent,
                    defaults={
                        "description": definition.get("description", ""),
                        "position": position + idx,
                    },
                )
                children = definition.get("children") or []
                if children:
                    create_templates(children, parent=obj, position=0)

        create_templates(MASTER_CATEGORIES)

    def _ensure_demo_wallet(self, user):
        wallet = Wallet.objects.filter(owner=user, name="Ví Tiền Mặt").first()
        if wallet:
            CategoryService.bootstrap_from_master(wallet)
            return wallet

        wallet = WalletService.create_wallet(
            user,
            name="Ví Tiền Mặt",
            currency="VND",
            initial_balance=Decimal("5000000"),
            description="Vi mac dinh de quan ly thu chi hang ngay",
            copy_master_categories=True,
        )
        return wallet

    def _ensure_sample_transactions(self, wallet: Wallet):
        if wallet.transactions.exists():
            return

        food_category = wallet.categories.filter(name="Ăn uống").first()
        salary_category = wallet.categories.filter(name="Lương").first()

        if not food_category or not salary_category:
            self.stdout.write(self.style.WARNING("Khong tim thay category de tao giao dich mau."))
            return

        TransactionService.create_transaction(
            wallet,
            food_category,
            amount=Decimal("85000"),
            note="Ăn sáng",
            occurred_at=timezone.now().replace(hour=7, minute=30),
        )
        TransactionService.create_transaction(
            wallet,
            salary_category,
            amount=Decimal("15000000"),
            note="Nhận lương tháng",
            occurred_at=timezone.now().replace(day=1, hour=9, minute=0),
        )

