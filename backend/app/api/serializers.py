from datetime import datetime, timezone

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")
        read_only_fields = fields


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Tuỳ biến payload trả về khi lấy JWT token.
    """

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    access_expires = serializers.DateTimeField(read_only=True)
    refresh_expires = serializers.DateTimeField(read_only=True)
    user = UserInfoSerializer(read_only=True)

    def validate(self, attrs):
        data = super().validate(attrs)

        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token

        data.update(
            {
                "refresh": str(refresh),
                "access": str(access_token),
                "access_expires": self._format_exp(access_token["exp"]),
                "refresh_expires": self._format_exp(refresh["exp"]),
                "user": UserInfoSerializer(self.user).data,
            }
        )

        return data

    @staticmethod
    def _format_exp(timestamp: int) -> datetime:
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)

