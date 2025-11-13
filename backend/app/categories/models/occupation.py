from django.db import models
from django.utils.translation import gettext_lazy as _


class Occupation(models.Model):
	name = models.CharField(max_length=200, verbose_name=_("Tên"))
	parent = models.ForeignKey(
		"self",
		null=True,
		blank=True,
		on_delete=models.CASCADE,
		related_name="children",
		verbose_name=_("Parent"),
	)
	description = models.TextField(blank=True, verbose_name=_("Mô tả"))
	is_active = models.BooleanField(default=True, verbose_name=_("Kích hoạt"))
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "category_occupation"
		ordering = ["name"]
		verbose_name = _("Occupation")
		verbose_name_plural = _("Occupations")

	def __str__(self) -> str:
		return self.name


