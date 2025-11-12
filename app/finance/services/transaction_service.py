from decimal import Decimal

from django.db import transaction
from django.db.models import F

from app.finance.models import Category, Transaction, TransactionType, Wallet
from app.finance.repositories import TransactionRepository


class TransactionService:
    INCREASE_TYPES = {TransactionType.INCOME, TransactionType.BORROW}
    DECREASE_TYPES = {TransactionType.EXPENSE, TransactionType.LEND}

    @staticmethod
    def list_transactions(wallet: Wallet):
        return TransactionRepository.for_wallet(wallet)

    @staticmethod
    @transaction.atomic
    def create_transaction(
        wallet: Wallet,
        category: Category,
        *,
        transaction_type: str | None = None,
        amount: Decimal,
        **data,
    ) -> Transaction:
        tx_type = transaction_type or category.transaction_type
        tx = TransactionRepository.create(
            wallet=wallet,
            category=category,
            transaction_type=tx_type,
            amount=amount,
            **data,
        )
        TransactionService._apply_wallet_balance(wallet, tx_type, amount)
        return tx

    @staticmethod
    @transaction.atomic
    def update_transaction(
        transaction_obj: Transaction,
        *,
        transaction_type: str | None = None,
        amount: Decimal | None = None,
        **data,
    ) -> Transaction:
        original_type = transaction_obj.transaction_type
        original_amount = transaction_obj.amount

        updated_type = transaction_type or transaction_obj.transaction_type
        updated_amount = amount if amount is not None else transaction_obj.amount

        updated = TransactionRepository.update(
            transaction_obj,
            transaction_type=updated_type,
            amount=updated_amount,
            **data,
        )

        TransactionService._reconcile_wallet_balance(
            updated.wallet, original_type, original_amount, updated_type, updated_amount
        )
        return updated

    @staticmethod
    def _apply_wallet_balance(wallet: Wallet, transaction_type: str, amount: Decimal):
        sign = TransactionService._resolve_delta(transaction_type)
        Wallet.objects.filter(pk=wallet.pk).update(
            current_balance=F("current_balance") + (sign * Decimal(amount))
        )
        wallet.refresh_from_db(fields=["current_balance"])

    @staticmethod
    def _reconcile_wallet_balance(
        wallet: Wallet,
        original_type: str,
        original_amount: Decimal,
        updated_type: str,
        updated_amount: Decimal,
    ):
        Wallet.objects.filter(pk=wallet.pk).update(
            current_balance=F("current_balance")
            - TransactionService._resolve_delta(original_type) * Decimal(original_amount)
            + TransactionService._resolve_delta(updated_type) * Decimal(updated_amount)
        )
        wallet.refresh_from_db(fields=["current_balance"])

    @staticmethod
    def _resolve_delta(transaction_type: str) -> Decimal:
        if transaction_type in TransactionService.INCREASE_TYPES:
            return Decimal("1")
        if transaction_type in TransactionService.DECREASE_TYPES:
            return Decimal("-1")
        raise ValueError(f"Unsupported transaction type: {transaction_type}")

    @staticmethod
    @transaction.atomic
    def delete_transaction(transaction_obj: Transaction) -> None:
        wallet = transaction_obj.wallet
        delta = TransactionService._resolve_delta(transaction_obj.transaction_type)
        Wallet.objects.filter(pk=wallet.pk).update(
            current_balance=F("current_balance") - delta * Decimal(transaction_obj.amount)
        )
        TransactionRepository.delete(transaction_obj)
        wallet.refresh_from_db(fields=["current_balance"])

