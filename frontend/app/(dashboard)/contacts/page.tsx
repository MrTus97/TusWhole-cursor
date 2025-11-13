"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  FilterBuilder,
  FilterField,
  FilterCondition,
} from "@/components/filter-builder";
import {
  buildFilterParams,
  buildFilterQueryString,
  parseFilterFromQuery,
} from "@/lib/filter-utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

type CustomFieldValue = string | number | boolean | string[] | number[] | null;

interface Contact {
  id: number;
  full_name: string;
  nickname?: string;
  occupation?: number | null;
  occupation_name?: string | null;
  current_address?: string;
  hometown?: string;
  phone_number?: string;
  importance: string;
  date_of_birth?: string;
  notes?: string;
  created_at?: string;
  custom_fields?: Array<{
    custom_field: number | { id: number };
    value: CustomFieldValue;
  }>;
}

interface CustomField {
  id: number;
  name: string;
  description?: string;
  field_type: string;
  target_model: string;
  min_length?: number;
  max_length?: number;
  default_value?: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  options?: string[];
  order: number;
  is_active: boolean;
}

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<number, CustomFieldValue>
  >({});
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [defaultColumns, setDefaultColumns] = useState<string[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    []
  );
  const [formData, setFormData] = useState<Partial<Contact>>({
    full_name: "",
    nickname: "",
    occupation: null,
    current_address: "",
    hometown: "",
    phone_number: "",
    importance: "medium",
    date_of_birth: "",
    notes: "",
  });
  const [occupationOptions, setOccupationOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [occupationSearch, setOccupationSearch] = useState<string>("");
  const [isAddOccupationOpen, setIsAddOccupationOpen] = useState(false);
  const [newOccupationName, setNewOccupationName] = useState<string>("");
  const [totalCount, setTotalCount] = useState<number>(0);
  const [defaultPageSize, setDefaultPageSize] = useState<number>(100);
  const [orderingState, setOrderingState] = useState<string>("");

  const getPageSizeFromUrl = () => {
    if (!searchParams) return null;
    const ps = new URLSearchParams(searchParams.toString()).get("page_size");
    const n = ps ? parseInt(ps, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const getPageFromUrl = () => {
    if (!searchParams) return 1;
    const p = new URLSearchParams(searchParams.toString()).get("page");
    const n = p ? parseInt(p, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  const getOrderingFromUrl = () => {
    if (!searchParams) return "";
    return new URLSearchParams(searchParams.toString()).get("ordering") || "";
  };

  useEffect(() => {
    // Đồng bộ ordering state khi URL thay đổi do các hành động khác (Apply/paginate)
    setOrderingState(getOrderingFromUrl() || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadCustomFields();
    loadFilterMetadata();
    loadOccupationOptions();
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
        apiClient
          .getContacts(filterParams)
          .then((data) => {
            setContacts(Array.isArray(data) ? data : data.results || []);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error loading contacts:", error);
            setLoading(false);
          });
      } else {
        // Không có filter trong URL, load data bình thường
        loadData();
      }
    }
  }, [filterFields, searchParams]);

  const loadFilterMetadata = async () => {
    try {
      const data = await apiClient.getContactFilterMetadata();
      setFilterFields(data.fields || []);
      setDefaultColumns(data.default_columns || []);
      if (typeof data.default_page_size === "number") {
        setDefaultPageSize(data.default_page_size);
      }
    } catch (error) {
      console.error("Error loading filter metadata:", error);
    }
  };

  const loadOccupationOptions = async (search?: string) => {
    try {
      const data = await apiClient.getOccupations({
        search: search || undefined,
        is_active: "true",
      });
      const items = Array.isArray(data) ? data : data.results || [];
      setOccupationOptions(
        items.map((i: { id: number; name: string }) => ({
          id: i.id,
          name: i.name,
        }))
      );
    } catch (error) {
      console.error("Error loading occupations:", error);
    }
  };

  const loadCustomFields = async () => {
    try {
      const data = await apiClient.getCustomFields({
        target_model: "contact",
        is_active: "true",
      });
      const fields = Array.isArray(data) ? data : data.results || [];
      setCustomFields(fields);
    } catch (error) {
      console.error("Error loading custom fields:", error);
    }
  };

  const loadData = async () => {
    try {
      const filterParams = buildFilterParams(filterConditions);
      const page_size = getPageSizeFromUrl() || defaultPageSize || undefined;
      const page = getPageFromUrl();
      const ordering = orderingState || getOrderingFromUrl() || undefined;
      const data = await apiClient.getContacts({
        ...filterParams,
        page_size,
        page,
        ordering,
      });
      const list = Array.isArray(data) ? data : data.results || [];
      setContacts(list);
      setTotalCount(Array.isArray(data) ? list.length : data.count || 0);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  // handleApplyFilter không còn sử dụng (FilterBuilder gọi trực tiếp qua onApply)

  const handleOpenDialog = async (contact?: Contact) => {
    // Reload custom fields để đảm bảo có dữ liệu mới nhất
    await loadCustomFields();

    if (contact) {
      setEditingContact(contact);
      setFormData({
        full_name: contact.full_name || "",
        nickname: contact.nickname || "",
        occupation:
          typeof contact.occupation === "number" ? contact.occupation : null,
        current_address: contact.current_address || "",
        hometown: contact.hometown || "",
        phone_number: contact.phone_number || "",
        importance: contact.importance || "medium",
        date_of_birth: contact.date_of_birth || "",
        notes: contact.notes || "",
      });
      // Load custom field values
      const values: Record<number, any> = {};
      if (contact.custom_fields && Array.isArray(contact.custom_fields)) {
        contact.custom_fields.forEach(
          (cf: {
            custom_field: number | { id: number };
            value: CustomFieldValue;
          }) => {
            // custom_field có thể là ID hoặc object
            const fieldId =
              typeof cf.custom_field === "object"
                ? cf.custom_field.id
                : cf.custom_field;
            if (fieldId) {
              values[fieldId] = cf.value;
            }
          }
        );
      }
      setCustomFieldValues(values);
    } else {
      setEditingContact(null);
      setFormData({
        full_name: "",
        nickname: "",
        occupation: null,
        current_address: "",
        hometown: "",
        phone_number: "",
        importance: "medium",
        date_of_birth: "",
        notes: "",
      });
      // Set default values for custom fields
      const defaultValues: Record<number, CustomFieldValue> = {};
      customFields.forEach((field) => {
        if (field.default_value) {
          defaultValues[field.id] = field.default_value;
        }
      });
      setCustomFieldValues(defaultValues);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
    setCustomFieldValues({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        custom_fields: customFieldValues,
      };
      if (editingContact) {
        await apiClient.updateContact(editingContact.id, submitData);
      } else {
        await apiClient.createContact(submitData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Có lỗi xảy ra khi lưu liên hệ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) {
      return;
    }
    try {
      await apiClient.deleteContact(id);
      loadData();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Có lỗi xảy ra khi xóa liên hệ");
    }
  };

  const getImportanceLabel = (importance: string) => {
    const labels: Record<string, string> = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      very_high: "Rất cao",
    };
    return labels[importance] || importance;
  };

  const getImportanceColor = (importance: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      very_high: "bg-red-100 text-red-800",
    };
    return colors[importance] || "bg-gray-100 text-gray-800";
  };

  const renderCustomFieldInput = (field: CustomField) => {
    const value = customFieldValues[field.id] ?? field.default_value ?? "";
    const fieldId = `custom_field_${field.id}`;

    const handleChange = (newValue: CustomFieldValue) => {
      setCustomFieldValues({
        ...customFieldValues,
        [field.id]: newValue,
      });
    };

    switch (field.field_type) {
      case "text":
        return (
          <Input
            id={fieldId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.is_required}
            minLength={field.min_length}
            maxLength={field.max_length}
          />
        );

      case "textarea":
        return (
          <textarea
            id={fieldId}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.is_required}
            minLength={field.min_length}
            maxLength={field.max_length}
          />
        );

      case "number":
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) =>
              handleChange(e.target.value ? parseFloat(e.target.value) : "")
            }
            required={field.is_required}
          />
        );

      case "date":
        return (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "datetime":
        return (
          <Input
            id={fieldId}
            type="datetime-local"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.is_required}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={fieldId}
              checked={value === true || value === "true" || value === "True"}
              onChange={(e) => handleChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {value === true || value === "true" || value === "True"
                ? "Có"
                : "Không"}
            </Label>
          </div>
        );

      case "dropdown":
      case "radio":
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleChange(val)}
            required={field.is_required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn một giá trị" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => {
              const optionValue = Array.isArray(value) ? value : [];
              const isChecked = optionValue.includes(option);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${fieldId}_${index}`}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...optionValue, option]
                        : optionValue.filter((v) => v !== option);
                      handleChange(newValue);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label
                    htmlFor={`${fieldId}_${index}`}
                    className="cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={field.is_required}
          />
        );
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Sổ quan hệ" }]} />
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
        initialPageSize={getPageSizeFromUrl() ?? defaultPageSize}
        onApply={(columns, pageSize) => {
          setLoading(true);
          const filterParams = buildFilterParams(filterConditions);
          const queryString = buildFilterQueryString(filterConditions);
          const colsParam =
            columns && columns.length > 0 ? `columns=${columns.join(",")}` : "";
          const pageSizeParam = pageSize ? `page_size=${pageSize}` : "";
          const currentOrdering = orderingState || getOrderingFromUrl();
          const orderingParam = currentOrdering
            ? `ordering=${currentOrdering}`
            : "";
          const combined = [
            queryString,
            colsParam,
            pageSizeParam,
            orderingParam,
          ]
            .filter(Boolean)
            .join("&");
          const newUrl = combined ? `/contacts?${combined}` : "/contacts";
          router.push(newUrl);
          apiClient
            .getContacts({
              ...filterParams,
              page_size: pageSize || undefined,
              ordering: currentOrdering || undefined,
            })
            .then((data) => {
              const list = Array.isArray(data) ? data : data.results || [];
              setContacts(list);
              setTotalCount(
                Array.isArray(data) ? list.length : data.count || 0
              );
              setLoading(false);
            })
            .catch((error) => {
              console.error("Error loading contacts:", error);
              setLoading(false);
            });
        }}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sổ quan hệ</h1>
          <p className="text-gray-600 mt-2">
            Quản lý thông tin những người xung quanh bạn
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm liên hệ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "Chỉnh sửa liên hệ" : "Thêm liên hệ mới"}
              </DialogTitle>
              <DialogDescription>Điền thông tin về người này</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Biệt danh</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) =>
                        setFormData({ ...formData, nickname: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Số điện thoại</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Ngày sinh</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Ngành nghề</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={
                        formData.occupation ? String(formData.occupation) : ""
                      }
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          occupation: value ? Number(value) : null,
                        });
                      }}
                      onOpenChange={(open) => {
                        if (open && occupationOptions.length === 0) {
                          loadOccupationOptions();
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn ngành nghề" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 sticky top-0 bg-popover">
                          <Input
                            placeholder="Tìm kiếm..."
                            value={occupationSearch}
                            onChange={(e) => {
                              const q = e.target.value;
                              setOccupationSearch(q);
                              loadOccupationOptions(q);
                            }}
                          />
                        </div>
                        {occupationOptions.map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog
                      open={isAddOccupationOpen}
                      onOpenChange={setIsAddOccupationOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsAddOccupationOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Thêm ngành nghề</DialogTitle>
                          <DialogDescription>
                            Nhập tên ngành nghề mới
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="newOccupation">Tên ngành nghề</Label>
                          <Input
                            id="newOccupation"
                            value={newOccupationName}
                            onChange={(e) =>
                              setNewOccupationName(e.target.value)
                            }
                            placeholder="Ví dụ: Kế toán"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            onClick={async () => {
                              if (!newOccupationName.trim()) return;
                              try {
                                const created =
                                  await apiClient.createOccupation({
                                    name: newOccupationName.trim(),
                                    is_active: true,
                                    parent: null,
                                  });
                                // Cập nhật danh sách và chọn ngay
                                const newItem = {
                                  id: created.id,
                                  name: created.name,
                                };
                                setOccupationOptions((prev) => [
                                  newItem,
                                  ...prev,
                                ]);
                                setFormData((fd) => ({
                                  ...fd,
                                  occupation: created.id,
                                }));
                                setNewOccupationName("");
                                setIsAddOccupationOpen(false);
                              } catch (error) {
                                console.error(
                                  "Error creating occupation:",
                                  error
                                );
                              }
                            }}
                          >
                            Lưu
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_address">Chỗ ở hiện tại</Label>
                  <Input
                    id="current_address"
                    value={formData.current_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hometown">Quê quán</Label>
                  <Input
                    id="hometown"
                    value={formData.hometown}
                    onChange={(e) =>
                      setFormData({ ...formData, hometown: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importance">Độ quan trọng</Label>
                  <Select
                    value={formData.importance}
                    onValueChange={(value) =>
                      setFormData({ ...formData, importance: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="very_high">Rất cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <textarea
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Thông tin bổ sung
                    </h3>
                    <div className="space-y-4">
                      {customFields
                        .filter((field) => field.is_active)
                        .sort((a, b) => a.order - b.order)
                        .map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={`custom_field_${field.id}`}>
                              {field.name}
                              {field.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            {field.description && (
                              <p className="text-sm text-gray-500">
                                {field.description}
                              </p>
                            )}
                            {renderCustomFieldInput(field)}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
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
          <CardTitle>Danh sách liên hệ</CardTitle>
          <CardDescription>Tất cả liên hệ của bạn</CardDescription>
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
                : "full_name,nickname,phone_number,occupation,importance,date_of_birth"
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
            const renderCell = (key: string, c: Contact) => {
              switch (key) {
                case "full_name":
                  return c.full_name || "-";
                case "nickname":
                  return c.nickname || "-";
                case "phone_number":
                  return c.phone_number || "-";
                case "occupation":
                case "occupation_name":
                  return c.occupation_name || "-";
                case "importance":
                  return (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getImportanceColor(
                        c.importance
                      )}`}
                    >
                      {getImportanceLabel(c.importance)}
                    </span>
                  );
                case "date_of_birth":
                  return c.date_of_birth
                    ? new Date(c.date_of_birth).toLocaleDateString("vi-VN")
                    : "-";
                case "current_address":
                  return c.current_address || "-";
                case "hometown":
                  return c.hometown || "-";
                case "created_at":
                  return c.created_at
                    ? new Date(c.created_at).toLocaleString("vi-VN")
                    : "-";
                default:
                  return (c as Record<string, any>)[key] ?? "-";
              }
            };
            return (
              <DataTable
                data={contacts}
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
                basePath="/contacts"
                currentOrdering={
                  new URLSearchParams(searchParams?.toString()).get(
                    "ordering"
                  ) || ""
                }
                renderCell={renderCell}
                renderActions={(contact: Contact) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(contact)}
                      title="Sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      title="Xoá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                mapKeyToOrderingField={(key: string) =>
                  key === "occupation" || key === "occupation_name"
                    ? "occupation__name"
                    : key
                }
                onRequestData={({ ordering, page, page_size }) => {
                  setLoading(true);
                  const filterParams = buildFilterParams(filterConditions);
                  apiClient
                    .getContacts({
                      ...filterParams,
                      ordering: ordering || undefined,
                      page: page || undefined,
                      page_size: page_size || undefined,
                    })
                    .then((data) => {
                      const list = Array.isArray(data)
                        ? data
                        : data.results || [];
                      setContacts(list);
                      setTotalCount(
                        Array.isArray(data) ? list.length : data.count || 0
                      );
                      setLoading(false);
                    })
                    .catch(() => setLoading(false));
                }}
              />
            );
          })()}
          {contacts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Bạn chưa có liên hệ nào. Hãy thêm liên hệ đầu tiên.
            </div>
          )}
          {/* Pagination hiển thị từ DataTable */}
        </CardContent>
      </Card>
    </div>
  );
}
