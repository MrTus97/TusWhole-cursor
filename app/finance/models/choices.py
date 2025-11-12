from django.utils.translation import gettext_lazy as _
from django.db import models


class TransactionType(models.TextChoices):
    INCOME = "INCOME", _("Thu")
    EXPENSE = "EXPENSE", _("Chi")
    LEND = "LEND", _("Cho vay")
    BORROW = "BORROW", _("Đi vay")

