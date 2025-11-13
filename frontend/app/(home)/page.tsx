"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Users, Settings, BookOpen } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const modules = [
    {
      id: "finance",
      title: "Tài chính",
      description: "Quản lý ví và giao dịch thu chi",
      icon: Wallet,
      href: "/finance",
      color: "bg-blue-500",
    },
    {
      id: "contacts",
      title: "Sổ quan hệ",
      description: "Quản lý thông tin những người xung quanh",
      icon: Users,
      href: "/contacts",
      color: "bg-green-500",
    },
    {
      id: "journal",
      title: "Nhật ký",
      description: "Ghi chú những khoảnh khắc",
      icon: BookOpen,
      href: "/journal",
      color: "bg-orange-500",
    },
    {
      id: "settings",
      title: "Cài đặt",
      description: "Cài đặt hệ thống và custom fields",
      icon: Settings,
      href: "/settings",
      color: "bg-purple-500",
    },
  ];

  const handleModuleClick = (href: string) => {
    // Navigate đến URL gốc (không có query params)
    router.push(href);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Chào mừng đến với TusWhole
        </h1>
        <p className="text-lg text-gray-600">
          Hệ thống quản lý cá nhân toàn diện
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
              onClick={() => handleModuleClick(module.href)}
            >
              <CardHeader>
                <div
                  className={`${module.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription className="text-base">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModuleClick(module.href);
                  }}
                >
                  Mở module
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
