"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { ModuleMenu } from "@/components/module-menu";
import { Footer } from "@/components/footer";
import { Wallet, CreditCard, List, Users, FileText, Settings, BookOpen } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Xác định menu dựa trên pathname
  const getModuleMenu = () => {
    if (pathname?.startsWith("/finance")) {
      return {
        title: "Tài chính",
        icon: <Wallet className="w-5 h-5" />,
        href: "/finance",
        items: [
          { label: "Tổng quan", href: "/finance", icon: <Wallet className="w-4 h-4" /> },
          { label: "Ví", href: "/finance/wallets", icon: <CreditCard className="w-4 h-4" /> },
          { label: "Giao dịch", href: "/finance/transactions", icon: <List className="w-4 h-4" /> },
        ],
      };
    }
    if (pathname?.startsWith("/contacts")) {
      return {
        title: "Sổ quan hệ",
        icon: <Users className="w-5 h-5" />,
        href: "/contacts",
        items: [
          { label: "Danh sách liên hệ", href: "/contacts", icon: <Users className="w-4 h-4" /> },
        ],
      };
    }
    if (pathname?.startsWith("/journal")) {
      return {
        title: "Nhật ký",
        icon: <BookOpen className="w-5 h-5" />,
        href: "/journal",
        items: [
          { label: "Nhật ký", href: "/journal", icon: <BookOpen className="w-4 h-4" /> },
        ],
      };
    }
    if (pathname?.startsWith("/settings")) {
      return {
        title: "Cài đặt",
        icon: <Settings className="w-5 h-5" />,
        href: "/settings",
        items: [
          { label: "Custom Fields", href: "/settings", icon: <FileText className="w-4 h-4" /> },
        ],
      };
    }
    return null;
  };

  const moduleMenu = getModuleMenu();

  return (
    <div className="min-h-screen bg-gray-50 pb-14">
      {moduleMenu && (
        <ModuleMenu 
          title={moduleMenu.title} 
          items={moduleMenu.items}
          icon={moduleMenu.icon}
          href={moduleMenu.href}
        />
      )}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

