"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FilterBuilder, FilterField, FilterCondition } from "@/components/filter-builder";
import { buildFilterParams, buildFilterQueryString, parseFilterFromQuery } from "@/lib/filter-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WalletsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: "VND",
    initial_balance: "0",
    copy_master: true,
  });

  useEffect(() => {
    loadFilterMetadata();
  }, []);

  useEffect(() => {
    // Parse filter từ URL khi load trang
    if (filterFields.length > 0 && searchParams) {
      const urlConditions = parseFilterFromQuery(
        new URLSearchParams(searchParams.toString()),
        filterFields
      );
      if (urlConditions.length > 0) {
        setFilterConditions(urlConditions);
        // Load data với filter từ URL
        setLoading(true);
        const filterParams = buildFilterParams(urlConditions);
        apiClient.getWallets(filterParams).then((data) => {
          setWallets(data.results || data);
          setLoading(false);
        }).catch((error) => {
          console.error("Error loading wallets:", error);
          setLoading(false);
        });
      } else {
        // Không có filter trong URL, load data bình thường
        loadWallets();
      }
    }
  }, [filterFields, searchParams]);

  const loadFilterMetadata = async () => {
    try {
      const data = await apiClient.getWalletFilterMetadata();
      setFilterFields(data.fields || []);
    } catch (error) {
      console.error("Error loading filter metadata:", error);
    }
  };

  const loadWallets = async () => {
    try {
      const filterParams = buildFilterParams(filterConditions);
      const data = await apiClient.getWallets(filterParams);
      setWallets(data.results || data);
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setLoading(true);
    const filterParams = buildFilterParams(filterConditions);
    
    // Update URL với filter params
    const queryString = buildFilterQueryString(filterConditions);
    const newUrl = queryString 
      ? `/finance/wallets?${queryString}`
      : "/finance/wallets";
    router.push(newUrl);
    
    // Load data với filter
    apiClient.getWallets(filterParams).then((data) => {
      setWallets(data.results || data);
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading wallets:", error);
      setLoading(false);
    });
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createWallet({
        ...formData,
        initial_balance: parseFloat(formData.initial_balance),
        copy_master: formData.copy_master,
      });
      setDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        currency: "VND",
        initial_balance: "0",
        copy_master: true,
      });
      loadWallets();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Lỗi khi tạo ví");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ví này?")) return;
    try {
      await apiClient.deleteWallet(id);
      loadWallets();
    } catch (error) {
      alert("Lỗi khi xóa ví");
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Tài chính", href: "/finance" }, { label: "Ví" }]} />
      <FilterBuilder
        fields={filterFields}
        conditions={filterConditions}
        onChange={setFilterConditions}
        onApply={handleApplyFilter}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý ví</h1>
          <p className="text-gray-600 mt-2">Tạo và quản lý các ví của bạn</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tạo ví mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo ví mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin để tạo ví mới
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên ví *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Tiền tệ</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_balance">Số dư ban đầu</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initial_balance: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="copy_master"
                  checked={formData.copy_master}
                  onChange={(e) =>
                    setFormData({ ...formData, copy_master: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="copy_master">Sao chép master categories</Label>
              </div>
              <Button type="submit" className="w-full">
                Tạo ví
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ví</CardTitle>
          <CardDescription>Tất cả các ví của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên ví</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Tiền tệ</TableHead>
                <TableHead>Số dư</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell>{wallet.description || "-"}</TableCell>
                  <TableCell>{wallet.currency}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: wallet.currency || "VND",
                    }).format(parseFloat(wallet.current_balance))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(wallet.id)}
                    >
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {wallets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Chưa có ví nào. Hãy tạo ví đầu tiên của bạn.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

