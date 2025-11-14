"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { FilterBuilder, FilterCondition, FilterField } from "@/components/filter-builder";
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

export default function FundsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [funds, setFunds] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingFund, setEditingFund] = useState<any | null>(null);
	const [filterFields, setFilterFields] = useState<FilterField[]>([
		{ name: "name", label: "Tên quỹ", type: "text" },
		{ name: "description", label: "Mô tả", type: "text" },
	]);
	const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
	const [defaultColumns] = useState<string[]>(["name", "description", "totals_by_currency"]);
	const [defaultPageSize] = useState<number>(100);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const data = await apiClient.getFunds({});
			const list = data.results || data;
			setFunds(list);
			setTotalCount(Array.isArray(data) ? list.length : data.count || 0);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <div>Đang tải...</div>;

	const openDialog = (item?: any) => {
		if (item) {
			setEditingFund(item);
			setFormData({ name: item.name || "", description: item.description || "" });
		} else {
			setEditingFund(null);
			setFormData({ name: "", description: "" });
		}
		setIsDialogOpen(true);
	};

	const closeDialog = () => {
		setIsDialogOpen(false);
		setEditingFund(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editingFund) {
				await apiClient.updateFund(editingFund.id, formData);
			} else {
				await apiClient.createFund(formData);
			}
			closeDialog();
			await loadData();
		} catch (e) {
			alert("Có lỗi khi lưu quỹ");
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Bạn có chắc chắn muốn xoá quỹ này?")) return;
		try {
			await apiClient.deleteFund(id);
			await loadData();
		} catch {
			alert("Có lỗi khi xoá quỹ");
		}
	};

	return (
		<div className="space-y-6">
			<Breadcrumb items={[{ label: "Tài chính", href: "/finance" }, { label: "Quỹ" }]} />
			<FilterBuilder
				fields={filterFields}
				conditions={filterConditions}
				onChange={setFilterConditions}
				initialDisplayColumns={(typeof window !== "undefined" ? new URLSearchParams(searchParams?.toString()).get("columns") : null)?.split(",").filter(Boolean) || defaultColumns}
				initialPageSize={defaultPageSize}
				onApply={(columns, pageSize) => {
					setLoading(true);
					const params = new URLSearchParams(searchParams?.toString());
					if (columns && columns.length > 0) {
						params.set("columns", columns.join(","));
					} else {
						params.delete("columns");
					}
					if (pageSize) {
						params.set("page_size", String(pageSize));
					} else {
						params.delete("page_size");
					}
					const url = params.toString() ? `/finance/funds?${params.toString()}` : "/finance/funds";
					router.push(url);
					apiClient.getFunds({}).then((data) => {
						const list = data.results || data;
						setFunds(list);
						setTotalCount(Array.isArray(data) ? list.length : data.count || 0);
						setLoading(false);
					}).catch(() => setLoading(false));
				}}
			/>
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Quỹ</h1>
					<p className="text-gray-600 mt-2">Tổng hợp số dư theo quỹ</p>
				</div>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={() => openDialog()}>Thêm quỹ</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{editingFund ? "Chỉnh sửa quỹ" : "Thêm quỹ"}</DialogTitle>
							<DialogDescription>Thông tin quỹ</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Tên quỹ</Label>
								<Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Mô tả</Label>
								<Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={closeDialog}>Hủy</Button>
								<Button type="submit">Lưu</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Danh sách quỹ</CardTitle>
					<CardDescription>Tất cả các quỹ của bạn</CardDescription>
				</CardHeader>
				<CardContent>
					{(() => {
						const c = new URLSearchParams(searchParams?.toString()).get("columns");
						const selected = (c && c.length > 0 ? c : (defaultColumns.length > 0 ? defaultColumns.join(",") : "name,description,totals_by_currency")).split(",").filter(Boolean);
						const labelMap = selected.reduce<Record<string, string>>((acc, key) => {
							const map: Record<string, string> = {
								name: "Tên quỹ",
								description: "Mô tả",
								totals_by_currency: "Tổng theo tiền tệ",
								created_at: "Ngày tạo",
								updated_at: "Ngày cập nhật",
							};
							acc[key] = map[key] || key;
							return acc;
						}, {});
						const renderCell = (key: string, f: any) => {
							switch (key) {
								case "name": return f.name || "-";
								case "description": return f.description || "-";
								case "totals_by_currency":
									return (
										<div className="flex flex-wrap gap-1">
											{f.totals_by_currency && Object.keys(f.totals_by_currency).length > 0 ? (
												Object.entries(f.totals_by_currency).map(([currency, total]: any) => (
													<span key={currency} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
														{new Intl.NumberFormat("vi-VN", { style: "currency", currency: String(currency) }).format(parseFloat(String(total)))} ({currency})
													</span>
												))
											) : (
												<span className="text-gray-500">0</span>
											)}
										</div>
									);
								case "created_at": return f.created_at ? new Date(f.created_at).toLocaleString("vi-VN") : "-";
								case "updated_at": return f.updated_at ? new Date(f.updated_at).toLocaleString("vi-VN") : "-";
								default: return (f as Record<string, any>)[key] ?? "-";
							}
						};
						return (
							<DataTable
								data={funds}
								totalCount={totalCount}
								selectedColumns={selected}
								labelMap={labelMap}
								pageSize={parseInt(new URLSearchParams(searchParams?.toString()).get("page_size") || "", 10) || null}
								defaultPageSize={defaultPageSize}
								basePath="/finance/funds"
								currentOrdering={new URLSearchParams(searchParams?.toString()).get("ordering") || ""}
								renderCell={renderCell}
								renderActions={(fund: any) => (
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={() => openDialog(fund)}>Sửa</Button>
										<Button variant="destructive" size="sm" onClick={() => handleDelete(fund.id)}>Xoá</Button>
									</div>
								)}
								onRequestData={({ ordering, page, page_size }) => {
									setLoading(true);
									apiClient.getFunds({ ordering, page, page_size }).then((data) => {
										const list = data.results || data;
										setFunds(list);
										setTotalCount(Array.isArray(data) ? list.length : data.count || 0);
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


