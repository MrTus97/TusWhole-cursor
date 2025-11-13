from rest_framework import serializers

from app.categories.models import Occupation


class OccupationSerializer(serializers.ModelSerializer):
	parent_name = serializers.SerializerMethodField()

	class Meta:
		model = Occupation
		fields = (
			"id",
			"name",
			"parent",
			"parent_name",
			"description",
			"is_active",
			"created_at",
			"updated_at",
		)
		read_only_fields = ("id", "created_at", "updated_at", "parent_name")

	def get_parent_name(self, obj):
		return obj.parent.name if obj.parent_id else None


