from django.db import migrations, models
from django.utils.html import strip_tags


def populate_content_text(apps, schema_editor):
    JournalEntry = apps.get_model("journal", "JournalEntry")
    for entry in JournalEntry.objects.all():
        entry.content_text = strip_tags(entry.content or "").strip()
        entry.save(update_fields=["content_text"])


class Migration(migrations.Migration):

    dependencies = [
        ("journal", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="journalentry",
            name="content_text",
            field=models.TextField(blank=True, verbose_name="Nội dung dạng văn bản"),
        ),
        migrations.RunPython(populate_content_text, migrations.RunPython.noop),
    ]


