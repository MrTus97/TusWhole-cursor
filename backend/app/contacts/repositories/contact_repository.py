from django.db.models import QuerySet

from app.contacts.models import Contact


class ContactRepository:
    @staticmethod
    def for_user(user) -> QuerySet[Contact]:
        return Contact.objects.filter(owner=user).select_related("occupation")

    @staticmethod
    def get_by_id(contact_id: int) -> Contact:
        return Contact.objects.get(pk=contact_id)

    @staticmethod
    def create(**kwargs) -> Contact:
        return Contact.objects.create(**kwargs)

    @staticmethod
    def update(contact: Contact, **kwargs) -> Contact:
        for field, value in kwargs.items():
            setattr(contact, field, value)
        contact.save()
        return contact

