from __future__ import annotations

from collections.abc import Iterable
from typing import List

from django.db.models import QuerySet

from app.journal.models import JournalHashtag


class JournalHashtagRepository:
    @staticmethod
    def for_user(user) -> QuerySet[JournalHashtag]:
        return JournalHashtag.objects.filter(owner=user).order_by("name")

    @staticmethod
    def get_or_create(owner, name: str) -> JournalHashtag:
        normalized = JournalHashtag.normalize(name)
        if not normalized:
            raise ValueError("Hashtag không hợp lệ.")
        hashtag, created = JournalHashtag.objects.get_or_create(
            owner=owner,
            normalized_name=normalized,
            defaults={"name": normalized},
        )
        if not created and hashtag.name != normalized:
            hashtag.name = normalized
            hashtag.save(update_fields=["name", "normalized_name"])
        return hashtag

    @classmethod
    def bulk_get_or_create(cls, owner, names: Iterable[str]) -> List[JournalHashtag]:
        collection: dict[str, JournalHashtag] = {}
        for name in names:
            normalized = JournalHashtag.normalize(name)
            if not normalized or normalized in collection:
                continue
            collection[normalized] = cls.get_or_create(owner, normalized)
        return list(collection.values())


