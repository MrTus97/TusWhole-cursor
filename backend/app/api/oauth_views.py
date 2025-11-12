import secrets
import jwt
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def generate_state():
    """Generate a random state for OAuth"""
    return secrets.token_urlsafe(32)


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_google_url(request):
    """Get Google OAuth authorization URL"""
    from django.conf import settings
    
    client_id = getattr(settings, "GOOGLE_OAUTH2_CLIENT_ID", None)
    redirect_uri = request.query_params.get(
        "redirect_uri", 
        request.build_absolute_uri("/api/oauth/google/callback/")
    )
    
    if not client_id:
        return Response(
            {"error": "Google OAuth not configured"}, 
            status=400
        )
    
    state = generate_state()
    # Lưu state và redirect_uri vào cache với TTL 10 phút
    cache.set(f"oauth_state_{state}", {
        "redirect_uri": redirect_uri,
        "provider": "google"
    }, timeout=600)
    
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        "scope=openid email profile&"
        f"state={state}"
    )
    
    return Response({"auth_url": auth_url})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def oauth_google_callback(request):
    """Handle Google OAuth callback"""
    code = request.GET.get("code") or request.data.get("code")
    state = request.GET.get("state") or request.data.get("state")
    
    if not code:
        return Response({"error": "Missing authorization code"}, status=400)
    
    if not state:
        return Response({"error": "Missing state"}, status=400)
    
    # Lấy state từ cache
    state_data = cache.get(f"oauth_state_{state}")
    if not state_data:
        return Response({"error": "Invalid or expired state"}, status=400)
    
    # Xóa state khỏi cache sau khi sử dụng (one-time use)
    cache.delete(f"oauth_state_{state}")
    
    client_id = getattr(settings, "GOOGLE_OAUTH2_CLIENT_ID", None)
    client_secret = getattr(settings, "GOOGLE_OAUTH2_CLIENT_SECRET", None)
    redirect_uri = state_data.get(
        "redirect_uri",
        request.build_absolute_uri("/api/oauth/google/callback/")
    )
    
    if not client_id or not client_secret:
        return Response(
            {"error": "Google OAuth not configured"}, 
            status=400
        )
    
    # Exchange code for token
    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    
    if token_response.status_code != 200:
        return Response(
            {"error": "Failed to exchange code for token"}, 
            status=400
        )
    
    token_data = token_response.json()
    access_token = token_data.get("id_token") or token_data.get("access_token")
    
    # Get user info
    user_info_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    
    if user_info_response.status_code != 200:
        # Try with id_token
        try:
            decoded = jwt.decode(access_token, options={"verify_signature": False})
            user_info = {
                "email": decoded.get("email"),
                "name": decoded.get("name"),
                "picture": decoded.get("picture"),
                "sub": decoded.get("sub"),
            }
        except:
            return Response(
                {"error": "Failed to get user info"}, 
                status=400
            )
    else:
        user_info = user_info_response.json()
    
    # Create or get user
    email = user_info.get("email")
    if not email:
        return Response({"error": "Email not provided"}, status=400)
    
    user, created = User.objects.get_or_create(
        username=user_info.get("sub") or email.split("@")[0],
        defaults={
            "email": email,
            "first_name": user_info.get("given_name", ""),
            "last_name": user_info.get("family_name", ""),
        },
    )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_facebook_url(request):
    """Get Facebook OAuth authorization URL"""
    client_id = getattr(settings, "FACEBOOK_APP_ID", None)
    redirect_uri = request.query_params.get(
        "redirect_uri",
        request.build_absolute_uri("/api/oauth/facebook/callback/")
    )
    
    if not client_id:
        return Response(
            {"error": "Facebook OAuth not configured"}, 
            status=400
        )
    
    state = generate_state()
    # Lưu state và redirect_uri vào cache với TTL 10 phút
    cache.set(f"oauth_state_{state}", {
        "redirect_uri": redirect_uri,
        "provider": "facebook"
    }, timeout=600)
    
    auth_url = (
        "https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        "scope=email&"
        f"state={state}"
    )
    
    return Response({"auth_url": auth_url})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def oauth_facebook_callback(request):
    """Handle Facebook OAuth callback"""
    code = request.GET.get("code") or request.data.get("code")
    state = request.GET.get("state") or request.data.get("state")
    
    if not code:
        return Response({"error": "Missing authorization code"}, status=400)
    
    if not state:
        return Response({"error": "Missing state"}, status=400)
    
    # Lấy state từ cache
    state_data = cache.get(f"oauth_state_{state}")
    if not state_data:
        return Response({"error": "Invalid or expired state"}, status=400)
    
    # Xóa state khỏi cache sau khi sử dụng (one-time use)
    cache.delete(f"oauth_state_{state}")
    
    client_id = getattr(settings, "FACEBOOK_APP_ID", None)
    client_secret = getattr(settings, "FACEBOOK_APP_SECRET", None)
    redirect_uri = state_data.get(
        "redirect_uri",
        request.build_absolute_uri("/api/oauth/facebook/callback/")
    )
    
    if not client_id or not client_secret:
        return Response(
            {"error": "Facebook OAuth not configured"}, 
            status=400
        )
    
    # Exchange code for token
    token_response = requests.get(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        params={
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        },
    )
    
    if token_response.status_code != 200:
        return Response(
            {"error": "Failed to exchange code for token"}, 
            status=400
        )
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    # Get user info
    user_info_response = requests.get(
        "https://graph.facebook.com/v18.0/me",
        params={
            "fields": "id,name,email",
            "access_token": access_token,
        },
    )
    
    if user_info_response.status_code != 200:
        return Response(
            {"error": "Failed to get user info"}, 
            status=400
        )
    
    user_info = user_info_response.json()
    
    # Create or get user
    email = user_info.get("email")
    if not email:
        return Response({"error": "Email not provided"}, status=400)
    
    user, created = User.objects.get_or_create(
        username=f"fb_{user_info.get('id')}",
        defaults={
            "email": email,
            "first_name": user_info.get("name", "").split()[0] if user_info.get("name") else "",
            "last_name": " ".join(user_info.get("name", "").split()[1:]) if user_info.get("name") else "",
        },
    )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_github_url(request):
    """Get GitHub OAuth authorization URL"""
    client_id = getattr(settings, "GITHUB_CLIENT_ID", None)
    redirect_uri = request.query_params.get(
        "redirect_uri",
        request.build_absolute_uri("/api/oauth/github/callback/")
    )
    
    if not client_id:
        return Response(
            {"error": "GitHub OAuth not configured"}, 
            status=400
        )
    
    state = generate_state()
    # Lưu state và redirect_uri vào cache với TTL 10 phút
    cache.set(f"oauth_state_{state}", {
        "redirect_uri": redirect_uri,
        "provider": "github"
    }, timeout=600)
    
    auth_url = (
        "https://github.com/login/oauth/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "scope=user:email&"
        f"state={state}"
    )
    
    return Response({"auth_url": auth_url})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def oauth_github_callback(request):
    """Handle GitHub OAuth callback"""
    code = request.GET.get("code") or request.data.get("code")
    state = request.GET.get("state") or request.data.get("state")
    
    if not code:
        return Response({"error": "Missing authorization code"}, status=400)
    
    if not state:
        return Response({"error": "Missing state"}, status=400)
    
    # Lấy state từ cache
    state_data = cache.get(f"oauth_state_{state}")
    if not state_data:
        return Response({"error": "Invalid or expired state"}, status=400)
    
    # Xóa state khỏi cache sau khi sử dụng (one-time use)
    cache.delete(f"oauth_state_{state}")
    
    client_id = getattr(settings, "GITHUB_CLIENT_ID", None)
    client_secret = getattr(settings, "GITHUB_CLIENT_SECRET", None)
    redirect_uri = state_data.get(
        "redirect_uri",
        request.build_absolute_uri("/api/oauth/github/callback/")
    )
    
    if not client_id or not client_secret:
        return Response(
            {"error": "GitHub OAuth not configured"}, 
            status=400
        )
    
    # Exchange code for token
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        json={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        },
        headers={"Accept": "application/json"},
    )
    
    if token_response.status_code != 200:
        return Response(
            {"error": "Failed to exchange code for token"}, 
            status=400
        )
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        return Response(
            {"error": "Access token not received"}, 
            status=400
        )
    
    # Get user info
    user_info_response = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}"},
    )
    
    if user_info_response.status_code != 200:
        return Response(
            {"error": "Failed to get user info"}, 
            status=400
        )
    
    user_info = user_info_response.json()
    
    # Get email (may need separate request)
    email = user_info.get("email")
    if not email:
        emails_response = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"token {access_token}"},
        )
        if emails_response.status_code == 200:
            emails = emails_response.json()
            primary_email = next(
                (e for e in emails if e.get("primary")), 
                emails[0] if emails else None
            )
            email = primary_email.get("email") if primary_email else None
    
    if not email:
        return Response({"error": "Email not provided"}, status=400)
    
    # Create or get user
    user, created = User.objects.get_or_create(
        username=f"github_{user_info.get('id')}",
        defaults={
            "email": email,
            "first_name": user_info.get("name", "").split()[0] if user_info.get("name") else "",
            "last_name": " ".join(user_info.get("name", "").split()[1:]) if user_info.get("name") else "",
        },
    )
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    })

