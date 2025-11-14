"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Settings, FileText, FolderTree } from "lucide-react";

export default function SettingsDashboardPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Cài đặt" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt</h1>
          <p className="text-gray-600 mt-2">Trang tổng quan cài đặt (đang cập nhật)</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-gray-500">
          <Settings className="w-5 h-5" />
          <span>Dashboard</span>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/settings/categories">
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                <FolderTree className="w-6 h-6" />
              </div>
              <CardTitle>Danh mục</CardTitle>
              <CardDescription>Quản lý các danh mục dùng chung</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/settings/custom-fields">
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <CardTitle>Custom Field</CardTitle>
              <CardDescription>Thiết lập custom fields cho các module</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

