"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderTree } from "lucide-react";

export default function SettingsCategoriesPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Cài đặt", href: "/settings" }, { label: "Danh mục" }]} />
      <h1 className="text-3xl font-bold">Danh mục</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/categories/occupations">
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                <FolderTree className="w-6 h-6" />
              </div>
              <CardTitle>Ngành nghề</CardTitle>
              <CardDescription>Quản lý danh sách ngành nghề</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}


