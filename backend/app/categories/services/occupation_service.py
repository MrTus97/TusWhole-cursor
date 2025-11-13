from app.categories.models import Occupation
from app.categories.repositories import OccupationRepository


class OccupationService:
	@staticmethod
	def list_occupations():
		return OccupationRepository.active()

	@staticmethod
	def create_occupation(**data) -> Occupation:
		return OccupationRepository.create(**data)


