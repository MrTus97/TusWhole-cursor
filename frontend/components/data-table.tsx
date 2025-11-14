/** @jsxImportSource react */
"use client";

import React from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  totalCount: number;
  selectedColumns: string[];
  labelMap: Record<string, string>;
  pageSize: number | null;
  defaultPageSize: number;
  basePath: string; // ví dụ: "/contacts"
  currentOrdering?: string; // nếu không truyền sẽ lấy từ URL
  renderCell: (key: string, row: T) => React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
  onRequestData: (params: {
    ordering?: string;
    page?: number;
    page_size?: number | null;
  }) => void;
  mapKeyToOrderingField?: (key: string) => string;
}

export function DataTable<T>({
  data,
  totalCount,
  selectedColumns,
  labelMap,
  pageSize,
  defaultPageSize,
  basePath,
  currentOrdering,
  renderCell,
  renderActions,
  onRequestData,
  mapKeyToOrderingField,
}: DataTableProps<T>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const url = new URLSearchParams(searchParams?.toString());
  const ordering = currentOrdering || url.get("ordering") || "";
  const page =
    parseInt(new URLSearchParams(searchParams?.toString()).get("page") || "1", 10) ||
    1;
  const effectivePageSize =
    pageSize && pageSize > 0 ? pageSize : defaultPageSize || 100;

  const totalPages =
    effectivePageSize && effectivePageSize > 0
      ? Math.max(1, Math.ceil((totalCount || 0) / effectivePageSize))
      : 1;

  const startIndex =
    totalCount > 0 && effectivePageSize > 0 ? (page - 1) * effectivePageSize + 1 : 0;
  const endIndex =
    totalCount > 0 && effectivePageSize > 0
      ? Math.min(totalCount, page * effectivePageSize)
      : 0;
  const remainingCount = Math.max(0, (totalCount || 0) - endIndex);

  const getFieldForOrdering = (key: string) => {
    if (mapKeyToOrderingField) return mapKeyToOrderingField(key);
    return key;
  };

  const replaceUrl = (nextParams: URLSearchParams) => {
    if (typeof window !== "undefined") {
      const base = pathname || basePath || "/";
      const newUrl = `${base}?${nextParams.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const handleHeaderClick = (key: string) => {
    const field = getFieldForOrdering(key);
    const isDesc = ordering === `-${field}`;
    const isAsc = ordering === field;
    const nextOrdering = isDesc ? field : `-${field}`; // lần đầu: desc, lần 2: asc
    const params = new URLSearchParams(searchParams?.toString());
    params.set("ordering", nextOrdering);
    replaceUrl(params);
    onRequestData({
      ordering: nextOrdering,
      page,
      page_size: effectivePageSize,
    });
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(p));
    replaceUrl(params);
    onRequestData({
      ordering,
      page: p,
      page_size: effectivePageSize,
    });
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {selectedColumns.map((key) => {
              const field = getFieldForOrdering(key);
              const isDesc = ordering === `-${field}`;
              const isAsc = ordering === field;
              return (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none"
                  onClick={() => handleHeaderClick(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {labelMap[key] || key}
                    {isDesc ? (
                      <ArrowDown className="w-3 h-3" />
                    ) : isAsc ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    )}
                  </span>
                </TableHead>
              );
            })}
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: T, idx: number) => (
            <TableRow key={idx}>
              {selectedColumns.map((key) => (
                <TableCell key={key}>{renderCell(key, row)}</TableCell>
              ))}
              <TableCell>{renderActions ? renderActions(row) : null}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
        <div>
          Hiển thị {startIndex}-{endIndex} trên {totalCount || 0} bản ghi
        </div>
        <div>
          Còn {remainingCount} bản ghi
        </div>
      </div>

      {effectivePageSize ? (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => goToPage(1)}
          >
            Trang đầu
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => goToPage(Math.max(1, page - 1))}
          >
            Trang trước
          </Button>
          {/* Hiển thị tối đa 7 trang để gọn */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 4), Math.max(0, page - 4) + 7)
            .map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "default" : "outline"}
                onClick={() => goToPage(p)}
              >
                {p}
              </Button>
            ))}
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
          >
            Trang sau
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => goToPage(totalPages)}
          >
            Trang cuối
          </Button>
        </div>
      ) : null}
    </div>
  );
}


