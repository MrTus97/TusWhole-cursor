"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const provider = searchParams.get("provider") as "google" | "facebook" | "github";

      if (!code || !state || !provider) {
        setError("Thiếu thông tin xác thực");
        setLoading(false);
        return;
      }

      try {
        const data = await apiClient.handleOAuthCallback(provider, code, state);
        
        // Save tokens
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        
        // Update auth context
        if (data.user) {
          // Manually update auth state
          window.location.href = "/finance";
        } else {
          setError("Không nhận được thông tin người dùng");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error || 
          "Đăng nhập thất bại. Vui lòng thử lại."
        );
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:underline"
            >
              Quay lại trang đăng nhập
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

