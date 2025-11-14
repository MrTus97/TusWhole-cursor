"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { FilterBuilder, FilterCondition, FilterField } from "@/components/filter-builder";
import { buildFilterParams, buildFilterQueryString, parseFilterFromQuery } from "@/lib/filter-utils";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Occupation {
  id: number;
  name: string;
  parent: number | null;
  parent_name?: string | null;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function OccupationsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOccupation, setEditingOccupation] = useState<Occupation | null>(null);
  const [formData, setFormData] = useState<Partial<Occupation>>({
    name: "",
    parent: null,
    description: "",
    is_active: true,
  });
  const [parentOptions, setParentOptions] = useState<{ id: number; name: string }[]>([]);
  const [parentSearch, setParentSearch] = useState<string>("");
  const [filterFields, setFilterFields] = useState<FilterField[]>([
    { name: "name", label: "Tên", type: "text" },
    {
      name: "is_active",
      label: "Kích hoạt",
      type: "dropdown",
      options: [
        { value: "true", label: "Có" },
        { value: "false", label: "Không" },
      ],
    },
  ]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [defaultColumns] = useState<string[]>(["name", "parent_name", "is_active", "updated_at"]);
  const [defaultPageSize, setDefaultPageSize] = useState<number>(100);

  const loadData = async () => {
    setLoading(true);
    try {
      const pageSize = parseInt(new URLSearchParams(searchParams?.toString()).get("page_size") || "", 10) || defaultPageSize;
      const page = parseInt(new URLSearchParams(searchParams?.toString()).get("page") || "1", 10) || 1;
      const ordering = new URLSearchParams(searchParams?.toString()).get("ordering") || "";
      const params = buildFilterParams(filterConditions);
      const data = await apiClient.getOccupations({ ...params, page_size: pageSize, page, ordering: ordering || undefined });
      const list = Array.isArray(data) ? (data as Occupation[]) : (data.results || []);
      setOccupations(list);
      setTotalCount(Array.isArray(data) ? list.length : (data.count || 0));
    } finally {
      setLoading(false);
    }
  };

  const loadParentOptions = async (search?: string) => {
    try {
      const data = await apiClient.getOccupations({
        search: search || undefined,
        is_active: "true",
        page_size: 50,
      });
      const items = Array.isArray(data) ? (data as Occupation[]) : (data.results || []);
      setParentOptions(items.map((o) => ({ id: o.id, name: o.name })));
    } catch {
      // ignore
    }
  };

  const handleOpenDialog = (item?: Occupation) => {
    if (item) {
      setEditingOccupation(item);
      setFormData({
        name: item.name || "",
        parent: item.parent || null,
        description: item.description || "",
        is_active: item.is_active,
      });
    } else {
      setEditingOccupation(null);
      setFormData({
        name: "",
        parent: null,
        description: "",
        is_active: true,
      });
    }
    if (parentOptions.length === 0) {
      loadParentOptions();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOccupation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submit = {
        name: formData.name,
        parent: formData.parent,
        description: formData.description,
        is_active: formData.is_active ?? true,
      };
      if (editingOccupation) {
        await apiClient.updateOccupation(editingOccupation.id, submit);
      } else {
        await apiClient.createOccupation(submit);
      }
      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error("Error saving occupation:", error);
      alert("Có lỗi xảy ra khi lưu ngành nghề");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ngành nghề này?")) return;
    try {
      await apiClient.deleteOccupation(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting occupation:", error);
      alert("Có lỗi xảy ra khi xóa ngành nghề");
    }
  };

  useEffect(() => {
    if (searchParams && filterFields.length > 0) {
      const urlConds = parseFilterFromQuery(new URLSearchParams(searchParams.toString()), filterFields);
      if (urlConds.length > 0) setFilterConditions(urlConds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filterFields.length]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && occupations.length === 0) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Cài đặt", href: "/settings" }, { label: "Danh mục", href: "/settings/categories" }, { label: "Ngành nghề" }]} />
			<FilterBuilder
				fields={filterFields}
				conditions={filterConditions}
				onChange={setFilterConditions}
				initialDisplayColumns={(typeof window !== "undefined" ? new URLSearchParams(searchParams?.toString()).get("columns") : null)?.split(",").filter(Boolean) || defaultColumns}
				initialPageSize={parseInt(new URLSearchParams(searchParams?.toString()).get("page_size") || "", 10) || defaultPageSize}
				onApply={(columns, pageSize) => {
					setLoading(true);
					const queryString = buildFilterQueryString(filterConditions);
					const colsParam = columns && columns.length > 0 ? `columns=${columns.join(",")}` : "";
					const pageSizeParam = pageSize ? `page_size=${pageSize}` : "";
					const ordering = new URLSearchParams(searchParams?.toString()).get("ordering") || "";
					const orderingParam = ordering ? `ordering=${ordering}` : "";
					const combined = [queryString, colsParam, pageSizeParam, orderingParam].filter(Boolean).join("&");
					const newUrl = combined ? `/settings/categories/occupations?${combined}` : "/settings/categories/occupations";
					window.history.replaceState(null, "", newUrl);
					apiClient.getOccupations({ ...buildFilterParams(filterConditions), page_size: pageSize || undefined, ordering: ordering || undefined }).then((data) => {
						const list = Array.isArray(data) ? (data as Occupation[]) : (data.results || []);
						setOccupations(list);
						setTotalCount(Array.isArray(data) ? list.length : (data.count || 0));
						setLoading(false);
					}).catch(() => setLoading(false));
				}}
			/>
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Ngành nghề</h1>
					<p className="text-gray-600 mt-2">Danh sách ngành nghề dùng chung</p>
				</div>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={() => handleOpenDialog()}>
							<Plus className="w-4 h-4 mr-2" />
							Thêm Ngành nghề
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-xl">
						<DialogHeader>
							<DialogTitle>{editingOccupation ? "Chỉnh sửa Ngành nghề" : "Thêm Ngành nghề"}</DialogTitle>
							<DialogDescription>Quản lý thông tin ngành nghề</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit}>
							<div className="grid gap-4 py-2">
								<div className="space-y-2">
									<Label htmlFor="name">Tên <span className="text-red-500">*</span></Label>
									<Input
										id="name"
										value={formData.name || ""}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="parent">Parent</Label>
									<div className="flex items-center gap-2">
										<Select
											value={formData.parent ? String(formData.parent) : ""}
											onValueChange={(value) => {
												setFormData({
													...formData,
													parent: !value || value === "none" ? null : Number(value),
												});
											}}
											onOpenChange={(open) => {
												if (open && parentOptions.length === 0) {
													loadParentOptions();
												}
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Chọn parent (tuỳ chọn)" />
											</SelectTrigger>
											<SelectContent>
												<div className="p-2 sticky top-0 bg-popover">
													<Input
														placeholder="Tìm kiếm..."
														value={parentSearch}
														onChange={(e) => {
															const q = e.target.value;
															setParentSearch(q);
															loadParentOptions(q);
														}}
													/>
												</div>
												<SelectItem value="none">
													Không có
												</SelectItem>
												{parentOptions.map((opt) => (
													<SelectItem key={opt.id} value={String(opt.id)}>
														{opt.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">Mô tả</Label>
									<textarea
										id="description"
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										value={formData.description || ""}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									/>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="is_active"
										checked={!!formData.is_active}
										onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
										className="h-4 w-4 rounded border-gray-300"
									/>
									<Label htmlFor="is_active" className="cursor-pointer">Kích hoạt</Label>
								</div>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={handleCloseDialog}>
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
					<CardTitle>Danh sách Ngành nghề</CardTitle>
					<CardDescription>Tất cả ngành nghề</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
          {(() => {
            const c = new URLSearchParams(searchParams?.toString()).get("columns");
            const selected = (c && c.length > 0 ? c : (defaultColumns.length > 0 ? defaultColumns.join(",") : "name,parent_name,is_active,updated_at")).split(",").filter(Boolean);
            const labelMap = selected.reduce<Record<string, string>>((acc, key) => {
              const map: Record<string, string> = {
                id: "ID",
                name: "Tên",
                parent: "Parent ID",
                parent_name: "Parent",
                description: "Mô tả",
                is_active: "Kích hoạt",
                created_at: "Ngày tạo",
                updated_at: "Ngày cập nhật",
              };
              acc[key] = map[key] || key;
              return acc;
            }, {});
            const renderCell = (key: string, item: Occupation) => {
              switch (key) {
                case "name": return item.name || "-";
                case "parent_name": return item.parent_name || "-";
                case "is_active": return item.is_active ? "Kích hoạt" : "Tắt";
                case "created_at": return new Date(item.created_at).toLocaleString();
                case "updated_at": return new Date(item.updated_at).toLocaleString();
                default: return (item as unknown as Record<string, any>)[key] ?? "-";
              }
            };
            return (
              <DataTable
                data={occupations}
                totalCount={totalCount}
                selectedColumns={selected}
                labelMap={labelMap}
                pageSize={parseInt(new URLSearchParams(searchParams?.toString()).get("page_size") || "", 10) || null}
                defaultPageSize={defaultPageSize}
                basePath="/settings/categories/occupations"
                currentOrdering={new URLSearchParams(searchParams?.toString()).get("ordering") || ""}
                renderCell={renderCell}
                renderActions={(item: Occupation) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                onRequestData={({ ordering, page, page_size }) => {
                  setLoading(true);
                  const params = buildFilterParams(filterConditions);
                  apiClient.getOccupations({ ...params, ordering, page, page_size }).then((data) => {
                    const list = Array.isArray(data) ? (data as Occupation[]) : (data.results || []);
                    setOccupations(list);
                    setTotalCount(Array.isArray(data) ? list.length : (data.count || 0));
                    setLoading(false);
                  }).catch(() => setLoading(false));
                }}
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}


