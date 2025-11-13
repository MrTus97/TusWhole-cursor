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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [defaultColumns, setDefaultColumns] = useState<string[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [formData, setFormData] = useState({
    wallet: "",
    category: "",
    transaction_type: "EXPENSE",
    amount: "",
    note: "",
    occurred_at: new Date().toISOString().slice(0, 16),
  });
  const [defaultPageSize, setDefaultPageSize] = useState<number>(100);

  const getPageSizeFromUrl = () => {
    const ps = new URLSearchParams(searchParams?.toString() || "").get("page_size");
    const n = ps ? parseInt(ps, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  useEffect(() => {
    loadData();
    loadFilterMetadata();
  }, []);

  useEffect(() => {
    // Parse filter từ URL khi load trang (sau khi đã có filterFields)
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
        apiClient.getTransactions(filterParams).then((data) => {
          setTransactions(data.results || data);
          setLoading(false);
        }).catch((error) => {
          console.error("Error loading transactions:", error);
          setLoading(false);
        });
      }
    }
  }, [filterFields, searchParams]);

  const loadFilterMetadata = async () => {
    try {
      const data = await apiClient.getTransactionFilterMetadata();
      // Populate wallet and category options
      const fields = (data.fields || []).map((field: any) => {
        if (field.name === "wallet") {
          return {
            ...field,
            options: wallets.map((w) => ({ value: w.id.toString(), label: w.name })),
          };
        }
        if (field.name === "category") {
          return {
            ...field,
            options: categories.map((c) => ({ value: c.id.toString(), label: c.name })),
          };
        }
        return field;
      });
      setFilterFields(fields);
      setDefaultColumns(data.default_columns || []);
      if (typeof data.default_page_size === "number") {
        setDefaultPageSize(data.default_page_size);
      }
    } catch (error) {
      console.error("Error loading filter metadata:", error);
    }
  };

  useEffect(() => {
    if (selectedWallet) {
      loadCategories(selectedWallet);
    }
  }, [selectedWallet]);

  useEffect(() => {
    if (wallets.length > 0 || categories.length > 0) {
      loadFilterMetadata();
    }
  }, [wallets, categories]);

  const loadData = async () => {
    try {
      const filterParams = buildFilterParams(filterConditions);
      const [walletsData, transactionsData] = await Promise.all([
        apiClient.getWallets(),
        apiClient.getTransactions(filterParams),
      ]);
      setWallets(walletsData.results || walletsData);
      setTransactions(transactionsData.results || transactionsData);
    } catch (error) {
      console.error("Error loading data:", error);
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
      ? `/finance/transactions?${queryString}`
      : "/finance/transactions";
    router.push(newUrl);
    
    // Load data với filter
    apiClient.getTransactions(filterParams).then((data) => {
      setTransactions(data.results || data);
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading transactions:", error);
      setLoading(false);
    });
  };

  const loadCategories = async (walletId: number) => {
    try {
      const data = await apiClient.getCategories(walletId);
      setCategories(data.results || data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createTransaction({
        ...formData,
        wallet: parseInt(formData.wallet),
        category: parseInt(formData.category),
        amount: parseFloat(formData.amount),
      });
      setDialogOpen(false);
      setFormData({
        wallet: "",
        category: "",
        transaction_type: "EXPENSE",
        amount: "",
        note: "",
        occurred_at: new Date().toISOString().slice(0, 16),
      });
      setSelectedWallet(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Lỗi khi tạo giao dịch");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    try {
      await apiClient.deleteTransaction(id);
      loadData();
    } catch (error) {
      alert("Lỗi khi xóa giao dịch");
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INCOME: "Thu",
      EXPENSE: "Chi",
      LEND: "Cho vay",
      BORROW: "Đi vay",
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INCOME: "text-green-600",
      EXPENSE: "text-red-600",
      LEND: "text-blue-600",
      BORROW: "text-orange-600",
    };
    return colors[type] || "";
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Tài chính", href: "/finance" }, { label: "Giao dịch" }]} />
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
          const newUrl = combined ? `/finance/transactions?${combined}` : "/finance/transactions";
          router.push(newUrl);
          apiClient.getTransactions({ ...filterParams, page_size: pageSize || undefined }).then((data) => {
            setTransactions(data.results || data);
            setTotalCount(Array.isArray(data) ? (data as any[]).length : data.count || 0);
            setLoading(false);
          }).catch((error) => {
            console.error("Error loading transactions:", error);
            setLoading(false);
          });
        }}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Giao dịch</h1>
          <p className="text-gray-600 mt-2">Quản lý các giao dịch thu chi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tạo giao dịch</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo giao dịch mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin giao dịch
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wallet">Ví *</Label>
                <Select
                  value={formData.wallet}
                  onValueChange={(value) => {
                    setFormData({ ...formData, wallet: value, category: "" });
                    setSelectedWallet(parseInt(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ví" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedWallet && (
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(
                          (cat) =>
                            cat.transaction_type === formData.transaction_type
                        )
                        .map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="transaction_type">Loại giao dịch *</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      transaction_type: value,
                      category: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Thu</SelectItem>
                    <SelectItem value="EXPENSE">Chi</SelectItem>
                    <SelectItem value="LEND">Cho vay</SelectItem>
                    <SelectItem value="BORROW">Đi vay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Input
                  id="note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occurred_at">Thời gian</Label>
                <Input
                  id="occurred_at"
                  type="datetime-local"
                  value={formData.occurred_at}
                  onChange={(e) =>
                    setFormData({ ...formData, occurred_at: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Tạo giao dịch
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách giao dịch</CardTitle>
          <CardDescription>Tất cả các giao dịch của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const c = new URLSearchParams(searchParams?.toString()).get("columns");
            const selected = (c && c.length > 0 ? c : (defaultColumns.length > 0 ? defaultColumns.join(",") : "wallet,category,transaction_type,amount,occurred_at,note")).split(",").filter(Boolean);
            const labelMap = filterFields.reduce<Record<string, string>>((acc, f) => { acc[f.name] = f.label; return acc; }, {});
            const renderCell = (key: string, t: any) => {
              switch (key) {
                case "wallet": return t.wallet?.name || "-";
                case "category": return t.category?.name || "-";
                case "transaction_type":
                  return (
                    <span className={getTransactionTypeColor(t.transaction_type)}>
                      {getTransactionTypeLabel(t.transaction_type)}
                    </span>
                  );
                case "amount":
                  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: t.wallet?.currency || "VND" }).format(parseFloat(t.amount));
                case "occurred_at":
                  return t.occurred_at ? new Date(t.occurred_at).toLocaleString("vi-VN") : "-";
                case "note":
                  return t.note || "-";
                default:
                  return (t as Record<string, any>)[key] ?? "-";
              }
            };
            return (
              <DataTable
                data={transactions}
                totalCount={totalCount}
                selectedColumns={selected}
                labelMap={labelMap}
                pageSize={parseInt(new URLSearchParams(searchParams?.toString()).get("page_size") || "", 10) || null}
                defaultPageSize={defaultPageSize}
                basePath="/finance/transactions"
                currentOrdering={new URLSearchParams(searchParams?.toString()).get("ordering") || ""}
                renderCell={renderCell}
                renderActions={(transaction: any) => (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(transaction.id)}
                  >
                    Xóa
                  </Button>
                )}
                onRequestData={({ ordering, page, page_size }) => {
                  setLoading(true);
                  const filterParams = buildFilterParams(filterConditions);
                  apiClient.getTransactions({ ...filterParams, ordering, page, page_size }).then((data) => {
                    setTransactions(data.results || data);
                    setTotalCount(Array.isArray(data) ? (data as any[]).length : data.count || 0);
                    setLoading(false);
                  }).catch(() => setLoading(false));
                }}
              />
            );
          })()}
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Chưa có giao dịch nào. Hãy tạo giao dịch đầu tiên của bạn.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

