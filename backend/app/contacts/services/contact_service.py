from app.contacts.models import Contact
from app.contacts.repositories import ContactRepository


class ContactService:
    @staticmethod
    def create_contact(owner, **data) -> Contact:
        return ContactRepository.create(owner=owner, **data)

    @staticmethod
    def list_contacts(owner):
        return ContactRepository.for_user(owner)

    @staticmethod
    def update_contact(contact: Contact, **data) -> Contact:
        return ContactRepository.update(contact, **data)

