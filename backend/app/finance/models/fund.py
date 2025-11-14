from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Fund(models.Model):
	owner = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="funds",
	)
	name = models.CharField(max_length=100, verbose_name=_("Tên quỹ"))
	description = models.TextField(blank=True, verbose_name=_("Mô tả"))
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = ("owner", "name")
		ordering = ["name"]
		verbose_name = _("Fund")
		verbose_name_plural = _("Funds")

	def __str__(self) -> str:
		return f"{self.name} ({self.owner})"


