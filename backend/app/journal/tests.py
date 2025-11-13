from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from app.journal.models import JournalHashtag
from app.journal.services import JournalService


class JournalEntryModelTest(TestCase):
    def test_normalize_hashtag(self):
        self.assertEqual(JournalHashtag.normalize("#Xin Chào"), "xin-chao")
        self.assertEqual(JournalHashtag.normalize("  #daily-life  "), "daily-life")
        self.assertEqual(JournalHashtag.normalize(""), "")


class JournalServiceTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="tester", password="secret123")

    def test_create_entry_sanitizes_html(self):
        entry = JournalService.create_entry(
            self.user,
            title="Test",
            content='<script>alert("xss")</script><p><strong>Hello</strong> world!</p><figure class="table"><table><tbody><tr><td>Hi</td></tr></tbody></table></figure>',
            hashtags=["#life"],
        )
        self.assertIn("<strong>Hello</strong> world!", entry.content)
        self.assertIn("<table>", entry.content)
        self.assertNotIn("<script>", entry.content)
        self.assertEqual(entry.content_text, "Hello world!Hi")
        self.assertEqual(entry.hashtags.count(), 1)


class JournalUploadViewTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="uploader", password="secret123")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_upload_requires_file(self):
        url = reverse("journal:journal-upload")
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, 400)

    def test_upload_image_success(self):
        url = reverse("journal:journal-upload")
        image_content = BytesIO()
        image_content.write(b"filecontent")
        image_content.seek(0)
        upload = SimpleUploadedFile("test.png", image_content.read(), content_type="image/png")

        response = self.client.post(url, {"upload": upload}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertIn("url", response.data)

