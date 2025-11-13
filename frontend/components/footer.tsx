"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Footer() {
  const { logout, user } = useAuth();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors">
            TusWhole
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.username}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

