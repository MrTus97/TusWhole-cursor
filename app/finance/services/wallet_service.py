from django.db import transaction

from app.finance.models import Wallet
from app.finance.repositories import WalletRepository
from app.finance.services.category_service import CategoryService


class WalletService:
    @staticmethod
    @transaction.atomic
    def create_wallet(owner, *, copy_master_categories: bool = True, **data) -> Wallet:
        wallet = WalletRepository.create(owner=owner, **data)
        if copy_master_categories:
            CategoryService.bootstrap_from_master(wallet)
        return wallet

    @staticmethod
    def list_wallets(owner):
        return WalletRepository.for_user(owner)

    @staticmethod
    def update_wallet(wallet: Wallet, **data) -> Wallet:
        return WalletRepository.update(wallet, **data)

