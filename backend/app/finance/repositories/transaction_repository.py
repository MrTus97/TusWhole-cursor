from django.db.models import QuerySet

from app.finance.models import Transaction, Wallet


class TransactionRepository:
    @staticmethod
    def for_wallet(wallet: Wallet) -> QuerySet[Transaction]:
        return Transaction.objects.filter(wallet=wallet).select_related("wallet", "category")

    @staticmethod
    def get_by_id(transaction_id: int) -> Transaction:
        return Transaction.objects.select_related("wallet", "category").get(pk=transaction_id)

    @staticmethod
    def create(**kwargs) -> Transaction:
        return Transaction.objects.create(**kwargs)

    @staticmethod
    def update(transaction: Transaction, **kwargs) -> Transaction:
        for field, value in kwargs.items():
            setattr(transaction, field, value)
        transaction.save()
        return transaction

    @staticmethod
    def delete(transaction: Transaction) -> None:
        transaction.delete()

