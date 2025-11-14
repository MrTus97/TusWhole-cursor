from decimal import Decimal
from typing import Any

from django.db.models import Sum
from rest_framework import serializers

from app.finance.models import Fund, Wallet


class FundSerializer(serializers.ModelSerializer):
	totals_by_currency = serializers.SerializerMethodField()
	total_current_balance = serializers.SerializerMethodField()

	class Meta:
		model = Fund
		fields = (
			"id",
			"name",
			"description",
			"created_at",
			"updated_at",
			"totals_by_currency",
			"total_current_balance",
		)
		read_only_fields = ("id", "created_at", "updated_at", "totals_by_currency", "total_current_balance")

	def get_totals_by_currency(self, obj: Fund) -> dict[str, str]:
		qs = (
			Wallet.objects.filter(fund=obj)
			.values("currency")
			.annotate(total=Sum("current_balance"))
		)
		result: dict[str, str] = {}
		for row in qs:
			currency = row["currency"]
			total = row["total"] or Decimal("0")
			result[currency] = str(total)
		return result

	def get_total_current_balance(self, obj: Fund) -> str:
		# Sum across currencies (not meaningful if multiple currencies).
		# Caller UI nên ưu tiên dùng totals_by_currency.
		total = Wallet.objects.filter(fund=obj).aggregate(s=Sum("current_balance")).get("s") or Decimal("0")
		return str(total)


