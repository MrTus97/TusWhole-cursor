from __future__ import annotations

from collections.abc import Iterable
from typing import Sequence

import bleach
from bleach.css_sanitizer import CSSSanitizer
from django.db import transaction
from django.db.utils import OperationalError
from django.utils.html import strip_tags

from app.journal.models import JournalEntry, JournalHashtag
from app.journal.repositories import JournalEntryRepository, JournalHashtagRepository


class JournalService:
    ALLOWED_TAGS = [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "blockquote",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "span",
        "figure",
        "figcaption",
        "a",
        "code",
        "pre",
        "hr",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "img",
    ]
    ALLOWED_ATTRIBUTES = {
        "*": ["style", "class"],
        "a": ["href", "title", "target", "rel"],
        "img": ["src", "alt", "title", "width", "height"],
        "figure": ["class"],
        "span": ["style"],
        "p": ["style"],
        "table": ["style", "border", "cellpadding", "cellspacing"],
        "td": ["style", "colspan", "rowspan"],
        "th": ["style", "colspan", "rowspan"],
    }
    ALLOWED_STYLES = [
        "text-align",
        "font-weight",
        "font-style",
        "text-decoration",
        "list-style-type",
        "color",
        "background-color",
    ]

    @staticmethod
    def list_entries(owner):
        try:
            return JournalEntryRepository.for_user(owner)
        except OperationalError:
            return JournalEntry.objects.none()

    @staticmethod
    def list_hashtags(owner):
        try:
            return JournalHashtagRepository.for_user(owner)
        except OperationalError:
            return JournalHashtag.objects.none()

    @staticmethod
    def _prepare_hashtags(owner, hashtags: Iterable[str]) -> Sequence[JournalHashtag]:
        return JournalHashtagRepository.bulk_get_or_create(owner, hashtags)

    @classmethod
    def _sanitize_content(cls, content: str | None) -> tuple[str, str]:
        raw_content = content or ""
        css = CSSSanitizer(allowed_css_properties=cls.ALLOWED_STYLES)
        cleaned = bleach.clean(
            raw_content,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            css_sanitizer=css,
            strip=True,
        )
        plain_text = strip_tags(cleaned).strip()
        return cleaned, plain_text

    @classmethod
    @transaction.atomic
    def create_entry(cls, owner, *, hashtags: Iterable[str] | None = None, **data) -> JournalEntry:
        if owner is None:
            raise ValueError("Owner phải được cung cấp khi tạo nhật ký.")
        hashtag_objects = cls._prepare_hashtags(owner, hashtags or [])
        content_html, content_text = cls._sanitize_content(data.get("content"))
        payload = {
            **data,
            "content": content_html,
            "content_text": content_text,
        }
        return JournalEntryRepository.create(owner=owner, hashtags=hashtag_objects, **payload)

    @classmethod
    @transaction.atomic
    def update_entry(
        cls,
        entry: JournalEntry,
        *,
        hashtags: Iterable[str] | None = None,
        **data,
    ) -> JournalEntry:
        hashtag_objects = None
        if hashtags is not None:
            hashtag_objects = cls._prepare_hashtags(entry.owner, hashtags)
        payload = data.copy()
        if "content" in payload:
            content_html, content_text = cls._sanitize_content(payload["content"])
            payload["content"] = content_html
            payload["content_text"] = content_text
        return JournalEntryRepository.update(entry, hashtags=hashtag_objects, **payload)


