from __future__ import annotations

import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class JournalUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        upload = request.FILES.get("upload") or request.FILES.get("file")
        if not upload:
            return Response(
                {"error": {"message": "Không tìm thấy tệp upload."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if upload.size > getattr(settings, "JOURNAL_UPLOAD_MAX_SIZE", 10 * 1024 * 1024):
            return Response(
                {"error": {"message": "Tệp vượt quá kích thước cho phép (10MB)."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        ext = os.path.splitext(upload.name)[1] or ""
        filename = f"{uuid.uuid4().hex}{ext}"
        relative_path = os.path.join(
            "journal",
            "uploads",
            str(now.year),
            f"{now.month:02d}",
            filename,
        )

        saved_path = default_storage.save(relative_path, upload)
        url = request.build_absolute_uri(default_storage.url(saved_path))

        return Response({"url": url}, status=status.HTTP_201_CREATED)


