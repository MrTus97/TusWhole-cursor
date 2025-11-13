from django.db import migrations, models
import django.db.models.deletion


def migrate_occupation_text_to_fk(apps, schema_editor):
	Contact = apps.get_model("contacts", "Contact")
	Occupation = apps.get_model("categories", "Occupation")

	# Lấy tất cả occupation khác rỗng
	distinct_values = (
		Contact.objects.filter(occupation__isnull=False)
		.exclude(occupation__exact="")
		.values_list("occupation", flat=True)
		.distinct()
	)
	name_to_id = {}
	for name in distinct_values:
		occ, _ = Occupation.objects.get_or_create(
			name=name.strip(),
			defaults={"is_active": True},
		)
		name_to_id[name] = occ.id

	# Gán FK theo map
	for contact in Contact.objects.all():
		name = getattr(contact, "occupation", None)
		if name:
			occ_id = name_to_id.get(name)
			if occ_id:
				setattr(contact, "occupation_new_id", occ_id)
				contact.save(update_fields=["occupation_new"])


class Migration(migrations.Migration):

	dependencies = [
		("categories", "0002_create_occupation"),
		("contacts", "0001_initial"),
	]

	operations = [
		# Thêm trường mới tạm thời
		migrations.AddField(
			model_name="contact",
			name="occupation_new",
			field=models.ForeignKey(
				blank=True,
				null=True,
				on_delete=django.db.models.deletion.SET_NULL,
				related_name="contacts",
				to="categories.occupation",
				verbose_name="Ngành nghề",
			),
		),
		# Di chuyển dữ liệu
		migrations.RunPython(migrate_occupation_text_to_fk, migrations.RunPython.noop),
		# Xoá trường cũ
		migrations.RemoveField(
			model_name="contact",
			name="occupation",
		),
		# Đổi tên trường tạm thành occupation
		migrations.RenameField(
			model_name="contact",
			old_name="occupation_new",
			new_name="occupation",
		),
	]


