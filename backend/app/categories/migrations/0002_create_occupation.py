from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Occupation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="Tên")),
                ("description", models.TextField(blank=True, verbose_name="Mô tả")),
                ("is_active", models.BooleanField(default=True, verbose_name="Kích hoạt")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="children", to="categories.occupation", verbose_name="Parent")),
            ],
            options={
                "verbose_name": "Occupation",
                "verbose_name_plural": "Occupations",
                "ordering": ["name"],
                "db_table": "category_occupation",
            },
        ),
    ]


