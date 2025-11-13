"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RichTextEditor } from "@/components/rich-text-editor";
import { apiClient } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import {
  FilterBuilder,
  FilterCondition,
  FilterField,
} from "@/components/filter-builder";
import {
  buildFilterParams,
  buildFilterQueryString,
  parseFilterFromQuery,
} from "@/lib/filter-utils";

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  content_text: string;
  written_at: string;
  created_at: string;
  updated_at: string;
  hashtags: string[];
}

interface JournalHashtag {
  id: number;
  display_name?: string;
  name: string;
}

interface EntryFormState {
  title: string;
  content: string;
  written_at: string;
  hashtags: string;
}

const createEmptyForm = (): EntryFormState => ({
  title: "",
  content: "",
  written_at: toLocalInputValue(new Date().toISOString()),
  hashtags: "",
});

function toLocalInputValue(isoString: string | null | undefined): string {
  if (!isoString) {
    return "";
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toISOString(input: string): string | undefined {
  if (!input) {
    return undefined;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function normalizeApiList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray((data as { results?: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function formatDisplayDate(isoString: string): string {
  if (!isoString) {
    return "";
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleString();
}

function parseHashtags(raw: string): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,#]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") ? item : `#${item}`));
}

function hashtagsToString(hashtags: string[]): string {
  return hashtags.join(", ");
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    []
  );
  const [defaultColumns, setDefaultColumns] = useState<string[]>([]);
  const [defaultPageSize, setDefaultPageSize] = useState<number>(100);
  const [totalCount, setTotalCount] = useState<number>(0);
  // Legacy quick filters (giữ lại để tham khảo, có thể bỏ nếu không cần):
  const [search, setSearch] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<EntryFormState>(createEmptyForm());
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [hashtagError, setHashtagError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setEntryError(null);
    try {
      const params = buildFilterParams(filterConditions);
      const pageSize =
        parseInt(
          new URLSearchParams(searchParams?.toString()).get("page_size") || "",
          10
        ) || defaultPageSize;
      const page =
        parseInt(
          new URLSearchParams(searchParams?.toString()).get("page") || "1",
          10
        ) || 1;
      const ordering =
        new URLSearchParams(searchParams?.toString()).get("ordering") || "";
      const data = await apiClient.getJournalEntries({
        ...params,
        page_size: pageSize,
        page,
        ordering: ordering || undefined,
      });
      const list = normalizeApiList<JournalEntry>(data);
      setEntries(list);
      setTotalCount(Array.isArray(data) ? list.length : (data as any).count || 0);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      setEntryError("Không thể tải danh sách nhật ký. Vui lòng thử lại sau.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filterConditions, searchParams, defaultPageSize]);

  const loadHashtags = useCallback(async () => {
    try {
      const data = await apiClient.getJournalHashtags();
      const values = normalizeApiList<JournalHashtag>(data).map(
        (item) => item.display_name ?? `#${item.name}`
      );
      setHashtags(values);
      setHashtagError(null);
    } catch (error) {
      console.error("Error loading hashtags:", error);
      setHashtags([]);
      setHashtagError(
        "Không thể tải hashtag. Bạn vẫn có thể tiếp tục ghi nhật ký."
      );
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    // Load filter metadata
    apiClient
      .getJournalFilterMetadata()
      .then((data) => {
        setFilterFields(data.fields || []);
        setDefaultColumns(data.default_columns || []);
        if (typeof data.default_page_size === "number") {
          setDefaultPageSize(data.default_page_size);
        }
      })
      .catch((error) => {
        console.error("Error loading journal filter metadata:", error);
      });
  }, []);

  useEffect(() => {
    // Parse filter từ URL khi có filterFields
    if (filterFields.length > 0 && searchParams) {
      const urlConds = parseFilterFromQuery(
        new URLSearchParams(searchParams.toString()),
        filterFields
      );
      if (urlConds.length > 0) {
        setFilterConditions(urlConds);
      }
    }
  }, [filterFields, searchParams]);

  useEffect(() => {
    loadHashtags();
  }, [loadHashtags]);

  const handleApplyFilters = () => {
    loadEntries();
  };

  const handleToggleHashtag = (tag: string) => {
    setSelectedHashtags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const openCreateDialog = () => {
    setEditingEntry(null);
    setFormState(createEmptyForm());
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormState({
      title: entry.title ?? "",
      content: entry.content ?? "",
      written_at: toLocalInputValue(entry.written_at),
      hashtags: hashtagsToString(entry.hashtags || []),
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    setFormState(createEmptyForm());
    setSaving(false);
  };

  const handleChange = (field: keyof EntryFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        title: formState.title || "",
        content: formState.content,
        written_at: toISOString(formState.written_at),
        hashtags: parseHashtags(formState.hashtags),
      };

      if (!payload.content || payload.content.trim() === "") {
        alert("Nội dung nhật ký không được để trống.");
        setSaving(false);
        return;
      }

      if (editingEntry) {
        await apiClient.updateJournalEntry(editingEntry.id, payload);
      } else {
        await apiClient.createJournalEntry(payload);
      }
      closeDialog();
      await Promise.all([loadEntries(), loadHashtags()]);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Có lỗi xảy ra khi lưu nhật ký.");
      setSaving(false);
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (!confirm("Bạn có chắc chắn muốn xoá nhật ký này?")) {
      return;
    }
    try {
      await apiClient.deleteJournalEntry(entry.id);
      await loadEntries();
      await loadHashtags();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      alert("Không thể xoá nhật ký. Vui lòng thử lại.");
    }
  };

  const selectedHashtagSet = useMemo(
    () => new Set(selectedHashtags),
    [selectedHashtags]
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Nhật ký" }]} />
      <FilterBuilder
        fields={filterFields}
        conditions={filterConditions}
        onChange={setFilterConditions}
        initialDisplayColumns={
          (typeof window !== "undefined"
            ? new URLSearchParams(searchParams?.toString()).get("columns")
            : null
          )
            ?.split(",")
            .filter(Boolean) || defaultColumns
        }
        initialPageSize={
          parseInt(
            new URLSearchParams(searchParams?.toString()).get("page_size") || "",
            10
          ) || defaultPageSize
        }
        onApply={(columns, pageSize) => {
          setLoading(true);
          const queryString = buildFilterQueryString(filterConditions);
          const colsParam =
            columns && columns.length > 0 ? `columns=${columns.join(",")}` : "";
          const pageSizeParam = pageSize ? `page_size=${pageSize}` : "";
          const ordering =
            new URLSearchParams(searchParams?.toString()).get("ordering") || "";
          const orderingParam = ordering ? `ordering=${ordering}` : "";
          const combined = [queryString, colsParam, pageSizeParam, orderingParam]
            .filter(Boolean)
            .join("&");
          const newUrl = combined ? `/journal?${combined}` : "/journal";
          window.history.replaceState(null, "", newUrl);
          apiClient
            .getJournalEntries({
              ...buildFilterParams(filterConditions),
              page_size: pageSize || undefined,
              ordering: ordering || undefined,
            })
            .then((data) => {
              const list = normalizeApiList<JournalEntry>(data);
              setEntries(list);
              setTotalCount(
                Array.isArray(data) ? list.length : (data as any).count || 0
              );
              setLoading(false);
            })
            .catch(() => setLoading(false));
        }}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Nhật ký cá nhân</CardTitle>
            <CardDescription>
              Ghi lại khoảnh khắc hằng ngày với định dạng phong phú.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>Viết nhật ký</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="journal-search">Tìm kiếm</Label>
              <Input
                id="journal-search"
                placeholder="Nhập từ khoá..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleApplyFilters();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="journal-hashtags">Hashtag</Label>
              <Input
                id="journal-hashtags"
                placeholder="Nhập hashtag cách nhau bởi dấu phẩy"
                value={selectedHashtags.join(", ")}
                onChange={(event) =>
                  setSelectedHashtags(parseHashtags(event.target.value))
                }
              />
            </div>
          </div>
          {hashtags.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Hashtag phổ biến
              </span>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleHashtag(tag)}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      selectedHashtagSet.has(tag)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" onClick={handleApplyFilters}>
              Áp dụng
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setSelectedHashtags([]);
                loadEntries();
              }}
            >
              Xoá lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {entryError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {entryError}
        </div>
      )}

      {hashtagError && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          {hashtagError}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Đang tải nhật ký...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-500">
          Chưa có nhật ký nào. Hãy bắt đầu bằng cách nhấn &ldquo;Viết nhật
          ký&rdquo;.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách nhật ký</CardTitle>
            <CardDescription>Tất cả các bài viết của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const columnsParam = new URLSearchParams(
                searchParams?.toString()
              ).get("columns");
              const selectedColumns = (
                columnsParam && columnsParam.length > 0
                  ? columnsParam
                  : defaultColumns.length > 0
                  ? defaultColumns.join(",")
                  : "title,written_at,updated_at,hashtags"
              )
                .split(",")
                .filter(Boolean);
              const labelMap = filterFields.reduce<Record<string, string>>(
                (acc, f) => {
                  acc[f.name] = f.label;
                  return acc;
                },
                {}
              );
              const renderCell = (key: string, e: JournalEntry) => {
                switch (key) {
                  case "title":
                    return e.title || "Không tiêu đề";
                  case "written_at":
                    return formatDisplayDate(e.written_at);
                  case "updated_at":
                    return formatDisplayDate(e.updated_at);
                  case "hashtags":
                    return e.hashtags && e.hashtags.length > 0
                      ? e.hashtags.join(", ")
                      : "-";
                  default:
                    return (e as unknown as Record<string, any>)[key] ?? "-";
                }
              };
              return (
                <DataTable
                  data={entries}
                  totalCount={totalCount}
                  selectedColumns={selectedColumns}
                  labelMap={labelMap}
                  pageSize={
                    parseInt(
                      new URLSearchParams(searchParams?.toString()).get(
                        "page_size"
                      ) || "",
                      10
                    ) || null
                  }
                  defaultPageSize={defaultPageSize}
                  basePath="/journal"
                  currentOrdering={
                    new URLSearchParams(searchParams?.toString()).get(
                      "ordering"
                    ) || ""
                  }
                  renderCell={renderCell}
                  renderActions={(entry: JournalEntry) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(entry)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(entry)}
                      >
                        Xoá
                      </Button>
                    </div>
                  )}
                  mapKeyToOrderingField={(key: string) => key}
                  onRequestData={({ ordering, page, page_size }) => {
                    setLoading(true);
                    apiClient
                      .getJournalEntries({
                        ...buildFilterParams(filterConditions),
                        ordering: ordering || undefined,
                        page: page || undefined,
                        page_size: page_size || undefined,
                      })
                      .then((data) => {
                        const list = normalizeApiList<JournalEntry>(data);
                        setEntries(list);
                        setTotalCount(
                          Array.isArray(data)
                            ? list.length
                            : (data as any).count || 0
                        );
                        setLoading(false);
                      })
                      .catch(() => setLoading(false));
                  }}
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => (!open ? closeDialog() : setIsDialogOpen(open))}
      >
        <DialogContent className="w-[92vw] sm:max-w-none max-w-[1100px] max-h-[88vh]">
          <div className="flex flex-col h-full space-y-4">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                {editingEntry ? "Chỉnh sửa nhật ký" : "Viết nhật ký"}
              </DialogTitle>
              <DialogDescription>
                Sử dụng CKEditor để định dạng nội dung. Hashtag giúp bạn lọc và
                tìm nhanh hơn.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="journal-title">Tiêu đề</Label>
                <Input
                  id="journal-title"
                  value={formState.title}
                  onChange={(event) =>
                    handleChange("title", event.target.value)
                  }
                  placeholder="Nhập tiêu đề (tuỳ chọn)"
                />
              </div>
            </div>
            <div className="grow overflow-y-auto pr-1 space-y-4">
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <div className="overflow-hidden rounded-xl border border-border bg-slate-50">
                  <div className="flex items-center justify-between border-b border-border bg-slate-100 px-4 py-2">
                    <span className="text-sm font-medium text-gray-700">
                      Document Editor
                    </span>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      CKEditor
                    </span>
                  </div>
                  <div className="bg-white p-4">
                    <RichTextEditor
                      className="border-0 shadow-none"
                      editorClassName="px-4 py-3"
                      minHeight={320}
                      value={formState.content}
                      onChange={(value) => handleChange("content", value)}
                      placeholder="Hôm nay bạn đã trải nghiệm điều gì thú vị?"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="journal-written-at">Thời điểm viết</Label>
                  <Input
                    id="journal-written-at"
                    type="datetime-local"
                    value={formState.written_at}
                    onChange={(event) =>
                      handleChange("written_at", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="journal-form-hashtags">Hashtag</Label>
                  <Input
                    id="journal-form-hashtags"
                    value={formState.hashtags}
                    onChange={(event) =>
                      handleChange("hashtags", event.target.value)
                    }
                    placeholder="#life, #daily"
                  />
                  <p className="text-xs text-gray-500">
                    Phân tách bằng dấu phẩy hoặc dấu #. Ví dụ: #work, #family
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Huỷ
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
