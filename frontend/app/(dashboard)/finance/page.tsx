"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, fundRes] = await Promise.all([
        apiClient.getWallets(),
        apiClient.getFunds(),
      ]);
      setWallets(walletRes.results || walletRes);
      setFunds(fundRes.results || fundRes);
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
      <Breadcrumb items={[{ label: "Tài chính" }]} />
      <div>
        <h1 className="text-3xl font-bold">Quản lý tài chính</h1>
        <p className="text-gray-600 mt-2">
          Tổng quan về ví và giao dịch của bạn
        </p>
      </div>

      {funds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Quỹ</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funds.map((fund) => (
              <Card key={fund.id}>
                <CardHeader>
                  <CardTitle>{fund.name}</CardTitle>
                  <CardDescription>
                    {fund.description || "Không có mô tả"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Tổng theo tiền tệ:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fund.totals_by_currency &&
                      Object.keys(fund.totals_by_currency).length > 0 ? (
                        Object.entries(fund.totals_by_currency).map(
                          ([currency, total]: any) => (
                            <span
                              key={currency}
                              className="px-2 py-1 bg-gray-100 rounded text-sm"
                            >
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: String(currency),
                              }).format(parseFloat(String(total)))}{" "}
                              ({currency})
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader>
              <CardTitle>{wallet.name}</CardTitle>
              <CardDescription>
                {wallet.description || "Không có mô tả"}
              </CardDescription>
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
                <Link href={`/finance/transactions?wallet=${wallet.id}`}>
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
