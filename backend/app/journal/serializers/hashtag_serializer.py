from __future__ import annotations

from rest_framework import serializers

from app.journal.models import JournalHashtag


class JournalHashtagSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = JournalHashtag
        fields = ("id", "display_name", "name", "created_at")
        read_only_fields = ("id", "created_at", "display_name")
