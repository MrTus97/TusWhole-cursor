from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0002_create_occupation"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Category",
        ),
    ]


