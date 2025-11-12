from django.db.models import QuerySet

from app.finance.models import Wallet


class WalletRepository:
    @staticmethod
    def for_user(user) -> QuerySet[Wallet]:
        return Wallet.objects.filter(owner=user)

    @staticmethod
    def get_by_id(wallet_id: int) -> Wallet:
        return Wallet.objects.get(pk=wallet_id)

    @staticmethod
    def create(**kwargs) -> Wallet:
        return Wallet.objects.create(**kwargs)

    @staticmethod
    def update(wallet: Wallet, **kwargs) -> Wallet:
        for field, value in kwargs.items():
            setattr(wallet, field, value)
        wallet.save()
        return wallet

