"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiClient.getWallets();
      setWallets(data.results || data);
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tài chính</h1>
        <p className="text-gray-600 mt-2">
          Tổng quan về ví và giao dịch của bạn
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader>
              <CardTitle>{wallet.name}</CardTitle>
              <CardDescription>{wallet.description || "Không có mô tả"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số dư:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: wallet.currency || "VND",
                    }).format(parseFloat(wallet.current_balance))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tiền tệ:</span>
                  <span>{wallet.currency}</span>
                </div>
                <Link href="/finance/transactions">
                  <Button variant="outline" className="w-full mt-4">
                    Xem giao dịch
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {wallets.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">Bạn chưa có ví nào</p>
            <Link href="/finance/wallets">
              <Button>Tạo ví mới</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

