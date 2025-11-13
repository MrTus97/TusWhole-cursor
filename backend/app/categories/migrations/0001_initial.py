from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

	initial = True

	dependencies = [
	]

	operations = [
		migrations.CreateModel(
			name='Category',
			fields=[
				('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
				('name', models.CharField(max_length=200, verbose_name='Tên')),
				('type', models.CharField(choices=[('occupation', 'Ngành nghề')], max_length=50, verbose_name='Loại')),
				('description', models.TextField(blank=True, verbose_name='Mô tả')),
				('is_active', models.BooleanField(default=True, verbose_name='Kích hoạt')),
				('created_at', models.DateTimeField(auto_now_add=True)),
				('updated_at', models.DateTimeField(auto_now=True)),
				('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='categories.category', verbose_name='Parent')),
			],
			options={
				'verbose_name': 'Category',
				'verbose_name_plural': 'Categories',
				'ordering': ['type', 'name'],
				'unique_together': {('type', 'name', 'parent')},
			},
		),
		migrations.AddIndex(
			model_name='category',
			index=models.Index(fields=['type', 'name'], name='categories_type_name_idx'),
		),
	]


