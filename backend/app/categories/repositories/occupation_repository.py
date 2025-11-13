from django.db.models import QuerySet

from app.categories.models import Occupation


class OccupationRepository:
	@staticmethod
	def all() -> QuerySet[Occupation]:
		return Occupation.objects.all()

	@staticmethod
	def active() -> QuerySet[Occupation]:
		return OccupationRepository.all().filter(is_active=True)

	@staticmethod
	def create(**kwargs) -> Occupation:
		return Occupation.objects.create(**kwargs)


