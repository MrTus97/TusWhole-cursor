from django.urls import path

from app.api import oauth_views, views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    # OAuth URLs
    path("oauth/google/url/", oauth_views.oauth_google_url, name="oauth-google-url"),
    path("oauth/google/callback/", oauth_views.oauth_google_callback, name="oauth-google-callback"),
    path("oauth/facebook/url/", oauth_views.oauth_facebook_url, name="oauth-facebook-url"),
    path("oauth/facebook/callback/", oauth_views.oauth_facebook_callback, name="oauth-facebook-callback"),
    path("oauth/github/url/", oauth_views.oauth_github_url, name="oauth-github-url"),
    path("oauth/github/callback/", oauth_views.oauth_github_callback, name="oauth-github-callback"),
]

