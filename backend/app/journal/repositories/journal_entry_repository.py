from __future__ import annotations

from typing import Iterable, Sequence

from django.db.models import Prefetch, QuerySet

from app.journal.models import JournalEntry, JournalHashtag


class JournalEntryRepository:
    @staticmethod
    def base_queryset() -> QuerySet[JournalEntry]:
        return JournalEntry.objects.select_related("owner").prefetch_related(
            Prefetch("hashtags", queryset=JournalHashtag.objects.only("id", "name", "normalized_name"))
        )

    @classmethod
    def for_user(cls, user) -> QuerySet[JournalEntry]:
        return cls.base_queryset().filter(owner=user)

    @staticmethod
    def create(*, owner, hashtags: Sequence[JournalHashtag] | None = None, **data) -> JournalEntry:
        entry = JournalEntry.objects.create(owner=owner, **data)
        if hashtags:
            entry.hashtags.set(hashtags)
        return entry

    @staticmethod
    def update(entry: JournalEntry, *, hashtags: Sequence[JournalHashtag] | None = None, **data) -> JournalEntry:
        for field, value in data.items():
            setattr(entry, field, value)
        entry.save()
        if hashtags is not None:
            entry.hashtags.set(hashtags)
        return entry

    @staticmethod
    def bulk_add_hashtags(entry: JournalEntry, hashtags: Iterable[JournalHashtag]) -> None:
        entry.hashtags.add(*hashtags)


