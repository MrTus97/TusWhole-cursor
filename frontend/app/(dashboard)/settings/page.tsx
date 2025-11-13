"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "boolean", label: "Boolean" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
];

const TARGET_MODELS = [
  { value: "contact", label: "Contact" },
  { value: "wallet", label: "Wallet" },
  { value: "transaction", label: "Transaction" },
];

export default function SettingsPage() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<Partial<CustomField>>({
    name: "",
    description: "",
    field_type: "text",
    target_model: "contact",
    min_length: undefined,
    max_length: undefined,
    default_value: "",
    is_required: false,
    is_searchable: false,
    is_filterable: false,
    options: [],
    order: 0,
    is_active: true,
  });
  const [optionsText, setOptionsText] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiClient.getCustomFields();
      setCustomFields(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Error loading custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name || "",
        description: field.description || "",
        field_type: field.field_type || "text",
        target_model: field.target_model || "contact",
        min_length: field.min_length,
        max_length: field.max_length,
        default_value: field.default_value || "",
        is_required: field.is_required || false,
        is_searchable: field.is_searchable || false,
        is_filterable: field.is_filterable || false,
        options: field.options || [],
        order: field.order || 0,
        is_active: field.is_active !== undefined ? field.is_active : true,
      });
      setOptionsText(Array.isArray(field.options) ? field.options.join("\n") : "");
    } else {
      setEditingField(null);
      setFormData({
        name: "",
        description: "",
        field_type: "text",
        target_model: "contact",
        min_length: undefined,
        max_length: undefined,
        default_value: "",
        is_required: false,
        is_searchable: false,
        is_filterable: false,
        options: [],
        order: 0,
        is_active: true,
      });
      setOptionsText("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Parse options text to array
      if (
        submitData.field_type === "dropdown" ||
        submitData.field_type === "checkbox" ||
        submitData.field_type === "radio"
      ) {
        submitData.options = optionsText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      } else {
        submitData.options = [];
      }

      if (editingField) {
        await apiClient.updateCustomField(editingField.id, submitData);
      } else {
        await apiClient.createCustomField(submitData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Error saving custom field:", error);
      alert("Có lỗi xảy ra khi lưu custom field");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa custom field này?")) {
      return;
    }
    try {
      await apiClient.deleteCustomField(id);
      loadData();
    } catch (error) {
      console.error("Error deleting custom field:", error);
      alert("Có lỗi xảy ra khi xóa custom field");
    }
  };

  const getFieldTypeLabel = (type: string) => {
    return FIELD_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTargetModelLabel = (model: string) => {
    return TARGET_MODELS.find((m) => m.value === model)?.label || model;
  };

  const needsOptions =
    formData.field_type === "dropdown" ||
    formData.field_type === "checkbox" ||
    formData.field_type === "radio";

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Cài đặt" }]} />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt</h1>
          <p className="text-gray-600 mt-2">
            Quản lý custom fields cho các model trong hệ thống
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm Custom Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Chỉnh sửa Custom Field" : "Thêm Custom Field mới"}
              </DialogTitle>
              <DialogDescription>
                Tạo custom field để thêm vào các model trong hệ thống
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Tên field <span className="text-red-500">*</span>
                    </Label>
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
                    <Label htmlFor="target_model">
                      Model đích <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.target_model}
                      onValueChange={(value) =>
                        setFormData({ ...formData, target_model: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
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
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field_type">
                      Loại field <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.field_type}
                      onValueChange={(value) => {
                        setFormData({ ...formData, field_type: value });
                        if (
                          value !== "dropdown" &&
                          value !== "checkbox" &&
                          value !== "radio"
                        ) {
                          setOptionsText("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Thứ tự hiển thị</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                {needsOptions && (
                  <div className="space-y-2">
                    <Label htmlFor="options">
                      Các tùy chọn (mỗi dòng một giá trị) <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="options"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      required={needsOptions}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_length">Độ dài tối thiểu</Label>
                    <Input
                      id="min_length"
                      type="number"
                      value={formData.min_length || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_length: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_length">Độ dài tối đa</Label>
                    <Input
                      id="max_length"
                      type="number"
                      value={formData.max_length || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_length: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_value">Giá trị mặc định</Label>
                  <Input
                    id="default_value"
                    value={formData.default_value}
                    onChange={(e) =>
                      setFormData({ ...formData, default_value: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_required"
                      checked={formData.is_required}
                      onChange={(e) =>
                        setFormData({ ...formData, is_required: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_required" className="cursor-pointer">
                      Bắt buộc
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_searchable"
                      checked={formData.is_searchable}
                      onChange={(e) =>
                        setFormData({ ...formData, is_searchable: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_searchable" className="cursor-pointer">
                      Có thể tìm kiếm
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_filterable"
                      checked={formData.is_filterable}
                      onChange={(e) =>
                        setFormData({ ...formData, is_filterable: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_filterable" className="cursor-pointer">
                      Có thể lọc
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Đang hoạt động
                    </Label>
                  </div>
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
          <CardTitle>Custom Fields</CardTitle>
          <CardDescription>
            Danh sách các custom field đã được tạo trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              Chưa có custom field nào. Hãy tạo custom field đầu tiên.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Bắt buộc</TableHead>
                  <TableHead>Tìm kiếm</TableHead>
                  <TableHead>Lọc</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>{getTargetModelLabel(field.target_model)}</TableCell>
                    <TableCell>{getFieldTypeLabel(field.field_type)}</TableCell>
                    <TableCell>{field.is_required ? "Có" : "Không"}</TableCell>
                    <TableCell>{field.is_searchable ? "Có" : "Không"}</TableCell>
                    <TableCell>{field.is_filterable ? "Có" : "Không"}</TableCell>
                    <TableCell>{field.order}</TableCell>
                    <TableCell>
                      {field.is_active ? (
                        <span className="text-green-600">Hoạt động</span>
                      ) : (
                        <span className="text-gray-400">Tắt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(field)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

