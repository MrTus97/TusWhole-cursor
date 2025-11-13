from __future__ import annotations

from django.utils import timezone
from django.utils.html import strip_tags
from rest_framework import serializers

from app.journal.models import JournalEntry
from app.journal.services import JournalService


class HashtagListField(serializers.Field):
    default_error_messages = {
        "not_a_list": "Hashtag phải là một danh sách chuỗi.",
        "invalid_item": "Mỗi hashtag phải là chuỗi ký tự hợp lệ.",
    }

    def to_representation(self, value):
        if not value:
            return []
        iterable = value.all() if hasattr(value, "all") else value
        return [f"#{hashtag.name}" for hashtag in iterable]

    def to_internal_value(self, data):
        if data in (None, serializers.empty):
            return []
        if not isinstance(data, list):
            self.fail("not_a_list")
        normalized = []
        for raw in data:
            if not isinstance(raw, str):
                self.fail("invalid_item")
            cleaned = raw.strip()
            if cleaned.startswith("#"):
                cleaned = cleaned[1:]
            if not cleaned:
                continue
            normalized.append(cleaned)
        return normalized


class JournalEntrySerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    hashtags = HashtagListField(required=False)
    content_text = serializers.CharField(read_only=True)

    class Meta:
        model = JournalEntry
        fields = (
            "id",
            "title",
            "content",
            "content_text",
            "written_at",
            "hashtags",
            "created_at",
            "updated_at",
            "owner",
        )
        read_only_fields = ("id", "created_at", "updated_at", "owner", "content_text")

    def validate_content(self, value):
        if value in (None, ""):
            raise serializers.ValidationError("Nội dung không được để trống.")
        if not strip_tags(value).strip():
            raise serializers.ValidationError("Nội dung phải có ít nhất một ký tự hiển thị.")
        return value

    def validate_written_at(self, value):
        if value is None:
            return timezone.now()
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        owner = request.user if request else None
        if owner is None or getattr(owner, "is_anonymous", False):
            raise serializers.ValidationError({"owner": "Không thể xác định người dùng hiện tại."})
        hashtags = validated_data.pop("hashtags", [])
        entry = JournalService.create_entry(owner, hashtags=hashtags, **validated_data)
        return entry

    def update(self, instance, validated_data):
        hashtags = validated_data.pop("hashtags", None)
        entry = JournalService.update_entry(instance, hashtags=hashtags, **validated_data)
        return entry


