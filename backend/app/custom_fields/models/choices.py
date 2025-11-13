from django.db import models


class FieldType(models.TextChoices):
    TEXT = "text", "Text"
    TEXTAREA = "textarea", "Textarea"
    NUMBER = "number", "Number"
    DATE = "date", "Date"
    DATETIME = "datetime", "DateTime"
    BOOLEAN = "boolean", "Boolean"
    DROPDOWN = "dropdown", "Dropdown"
    CHECKBOX = "checkbox", "Checkbox"
    RADIO = "radio", "Radio"


class TargetModel(models.TextChoices):
    CONTACT = "contact", "Contact"
    WALLET = "wallet", "Wallet"
    TRANSACTION = "transaction", "Transaction"

