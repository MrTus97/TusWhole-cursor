from django.urls import path
from rest_framework.routers import DefaultRouter

from app.journal.views import JournalEntryViewSet, JournalHashtagViewSet, JournalUploadView

router = DefaultRouter()
router.register(r"entries", JournalEntryViewSet, basename="journal-entry")
router.register(r"hashtags", JournalHashtagViewSet, basename="journal-hashtag")

app_name = "journal"

urlpatterns = router.urls + [
    path("uploads/", JournalUploadView.as_view(), name="journal-upload"),
]

