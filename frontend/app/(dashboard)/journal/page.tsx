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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RichTextEditor } from "@/components/rich-text-editor";
import { apiClient } from "@/lib/api";

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
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
      const params: Record<string, string> = {};
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedHashtags.length > 0) {
        params.hashtags = selectedHashtags.join(",");
      }
      const data = await apiClient.getJournalEntries(params);
      setEntries(normalizeApiList<JournalEntry>(data));
    } catch (error) {
      console.error("Error loading journal entries:", error);
      setEntryError("Không thể tải danh sách nhật ký. Vui lòng thử lại sau.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedHashtags]);

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
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-4">
                  <span>{entry.title || "Không tiêu đề"}</span>
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
                </CardTitle>
                <CardDescription>
                  Viết lúc {formatDisplayDate(entry.written_at)} • Cập nhật{" "}
                  {formatDisplayDate(entry.updated_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
                {entry.hashtags && entry.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.hashtags.map((tag) => (
                      <span
                        key={`${entry.id}-${tag}`}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
