"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FilterBuilder, FilterField, FilterCondition } from "@/components/filter-builder";
import { buildFilterParams, buildFilterQueryString, parseFilterFromQuery } from "@/lib/filter-utils";
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClearableSelect } from "@/components/clearable-select";
import { AmountInput } from "@/components/amount-input";

export default function WalletsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallets, setWallets] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any | null>(null);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [defaultColumns, setDefaultColumns] = useState<string[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [formData, setFormData] = useState({
    fund: "",
    name: "",
    description: "",
    currency: "VND",
    initial_balance: "0",
    copy_master: true,
  });
  const [editFormData, setEditFormData] = useState({
    fund: "",
    name: "",
    description: "",
    currency: "VND",
  });
  const [defaultPageSize, setDefaultPageSize] = useState<number>(100);

  const getPageSizeFromUrl = () => {
    const ps = new URLSearchParams(searchParams?.toString() || "").get("page_size");
    const n = ps ? parseInt(ps, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  };

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
      setDefaultColumns(data.default_columns || []);
      if (typeof data.default_page_size === "number") {
        setDefaultPageSize(data.default_page_size);
      }
    } catch (error) {
      console.error("Error loading filter metadata:", error);
    }
  };

  const loadWallets = async () => {
    try {
      const filterParams = buildFilterParams(filterConditions);
      const [wl, fs] = await Promise.all([
        apiClient.getWallets(filterParams),
        apiClient.getFunds(),
      ]);
      const walletsList = Array.isArray(wl) ? wl : (wl.results || []);
      setWallets(walletsList);
      setFunds(fs.results || fs);
      setTotalCount(Array.isArray(wl) ? walletsList.length : (wl.count || walletsList.length || 0));
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
        fund: formData.fund ? parseInt(formData.fund) : null,
        initial_balance: parseFloat(formData.initial_balance),
        copy_master: formData.copy_master,
      });
      setDialogOpen(false);
      setFormData({
        fund: "",
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

  const openEditDialog = (wallet: any) => {
    setEditingWallet(wallet);
    setEditFormData({
      fund: wallet.fund ? String(wallet.fund) : "",
      name: wallet.name || "",
      description: wallet.description || "",
      currency: wallet.currency || "VND",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;
    try {
      await apiClient.updateWallet(editingWallet.id, {
        fund: editFormData.fund ? parseInt(editFormData.fund) : null,
        name: editFormData.name,
        description: editFormData.description,
        currency: editFormData.currency,
      });
      setEditDialogOpen(false);
      setEditingWallet(null);
      await loadWallets();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Lỗi khi cập nhật ví");
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
        initialDisplayColumns={(typeof window !== "undefined" ? new URLSearchParams(searchParams?.toString()).get("columns") : null)?.split(",").filter(Boolean) || defaultColumns}
        initialPageSize={getPageSizeFromUrl() ?? defaultPageSize}
        onApply={(columns, pageSize) => {
          setLoading(true);
          const filterParams = buildFilterParams(filterConditions);
          const queryString = buildFilterQueryString(filterConditions);
          const colsParam = columns && columns.length > 0 ? `columns=${columns.join(",")}` : "";
          const pageSizeParam = pageSize ? `page_size=${pageSize}` : "";
          const combined = [queryString, colsParam, pageSizeParam].filter(Boolean).join("&");
          const newUrl = combined ? `/finance/wallets?${combined}` : "/finance/wallets";
          router.push(newUrl);
          apiClient.getWallets({ ...filterParams, page_size: pageSize || undefined }).then((data) => {
            setWallets(data.results || data);
            setTotalCount(Array.isArray(data) ? (data as any[]).length : data.count || 0);
            setLoading(false);
          }).catch((error) => {
            console.error("Error loading wallets:", error);
            setLoading(false);
          });
        }}
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
                <Label htmlFor="fund">Quỹ</Label>
                <ClearableSelect
                  value={formData.fund}
                  onChange={(value) => setFormData({ ...formData, fund: value })}
                  options={funds.map((f) => ({ value: String(f.id), label: f.name }))}
                  placeholder="Chọn quỹ (tuỳ chọn)"
                />
              </div>
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
                <AmountInput
                  id="initial_balance"
                  value={formData.initial_balance}
                  onChange={(raw) =>
                    setFormData({
                      ...formData,
                      initial_balance: raw,
                    })
                  }
                  currency={formData.currency || "VND"}
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
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa ví</DialogTitle>
              <DialogDescription>Cập nhật thông tin ví</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateWallet} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_fund">Quỹ</Label>
                <ClearableSelect
                  value={editFormData.fund}
                  onChange={(value) => setEditFormData({ ...editFormData, fund: value })}
                  options={funds.map((f) => ({ value: String(f.id), label: f.name }))}
                  placeholder="Chọn quỹ (tuỳ chọn)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name">Tên ví *</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Mô tả</Label>
                <Input
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_currency">Tiền tệ</Label>
                <Input
                  id="edit_currency"
                  value={editFormData.currency}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, currency: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu</Button>
              </DialogFooter>
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
          {(() => {
            const c = new URLSearchParams(searchParams?.toString()).get("columns");
            const selected = (c && c.length > 0 ? c : (defaultColumns.length > 0 ? defaultColumns.join(",") : "name,description,currency,current_balance")).split(",").filter(Boolean);
            const labelMap = filterFields.reduce<Record<string, string>>((acc, f) => { acc[f.name] = f.label; return acc; }, {});
            const renderCell = (key: string, w: any) => {
              switch (key) {
                case "name":
                  return (
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => router.push(`/finance/transactions?wallet=${w.id}`)}
                      title="Xem giao dịch ví này"
                    >
                      {w.name || "-"}
                    </button>
                  );
                case "description": return w.description || "-";
                case "currency": return w.currency || "-";
                case "current_balance":
                  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: w.currency || "VND" }).format(parseFloat(w.current_balance));
                case "created_at":
                  return w.created_at ? new Date(w.created_at).toLocaleString("vi-VN") : "-";
                default:
                  return (w as Record<string, any>)[key] ?? "-";
              }
            };
            return (
              <DataTable
                data={wallets}
                totalCount={totalCount}
                selectedColumns={selected}
                labelMap={labelMap}
                pageSize={parseInt(new URLSearchParams(searchParams?.toString()).get("page_size") || "", 10) || null}
                defaultPageSize={defaultPageSize}
                basePath="/finance/wallets"
                currentOrdering={new URLSearchParams(searchParams?.toString()).get("ordering") || ""}
                renderCell={renderCell}
                renderActions={(wallet: any) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(wallet)}
                      title="Chỉnh sửa ví"
                    >
                      Chỉnh sửa
                    </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(wallet.id)}
                      title="Xóa ví"
                  >
                    Xóa
                  </Button>
                  </div>
                )}
                onRequestData={({ ordering, page, page_size }) => {
                  setLoading(true);
                  const filterParams = buildFilterParams(filterConditions);
                  apiClient.getWallets({ ...filterParams, ordering, page, page_size }).then((data) => {
                    setWallets(data.results || data);
                    setTotalCount(Array.isArray(data) ? (data as any[]).length : data.count || 0);
                    setLoading(false);
                  }).catch(() => setLoading(false));
                }}
              />
            );
          })()}
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

