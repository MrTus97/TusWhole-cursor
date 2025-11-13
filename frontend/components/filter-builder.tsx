"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldType = "text" | "number" | "date" | "datetime" | "dropdown" | "boolean";

export interface FilterField {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean | null;
  enabled: boolean;
}

interface FilterBuilderProps {
  fields: FilterField[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  onApply: () => void;
}

const OPERATORS: Record<FieldType, { value: string; label: string }[]> = {
  text: [
    { value: "contains", label: "Chứa" },
    { value: "not_contains", label: "Không chứa" },
    { value: "starts_with", label: "Bắt đầu với" },
    { value: "ends_with", label: "Kết thúc bằng" },
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Khác" },
    { value: "is_empty", label: "Rỗng" },
    { value: "is_not_empty", label: "Không rỗng" },
  ],
  number: [
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Khác" },
    { value: "greater_than", label: "Lớn hơn" },
    { value: "less_than", label: "Nhỏ hơn" },
    { value: "greater_or_equal", label: "Lớn hơn hoặc bằng" },
    { value: "less_or_equal", label: "Nhỏ hơn hoặc bằng" },
    { value: "is_empty", label: "Rỗng" },
    { value: "is_not_empty", label: "Không rỗng" },
  ],
  date: [
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Khác" },
    { value: "greater_than", label: "Sau" },
    { value: "less_than", label: "Trước" },
    { value: "between", label: "Giữa" },
    { value: "is_empty", label: "Rỗng" },
    { value: "is_not_empty", label: "Không rỗng" },
  ],
  datetime: [
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Khác" },
    { value: "greater_than", label: "Sau" },
    { value: "less_than", label: "Trước" },
    { value: "between", label: "Giữa" },
    { value: "is_empty", label: "Rỗng" },
    { value: "is_not_empty", label: "Không rỗng" },
  ],
  dropdown: [
    { value: "equals", label: "Là" },
    { value: "not_equals", label: "Không là" },
    { value: "is_empty", label: "Rỗng" },
    { value: "is_not_empty", label: "Không rỗng" },
  ],
  boolean: [
    { value: "equals", label: "Là" },
    { value: "not_equals", label: "Không là" },
  ],
};

export function FilterBuilder({ fields, conditions, onChange, onApply }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>("");

  const availableFields = fields.filter(
    (field) => !conditions.some((cond) => cond.field === field.name && cond.enabled)
  );

  const addFilter = () => {
    if (!selectedField) return;

    const field = fields.find((f) => f.name === selectedField);
    if (!field) return;

    const defaultOperator = OPERATORS[field.type][0]?.value || "equals";
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: selectedField,
      operator: defaultOperator,
      value: field.type === "boolean" ? true : field.type === "number" ? 0 : "",
      enabled: true,
    };

    onChange([...conditions, newCondition]);
    setSelectedField("");
  };

  const removeFilter = (id: string) => {
    onChange(conditions.filter((cond) => cond.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange(
      conditions.map((cond) => (cond.id === id ? { ...cond, ...updates } : cond))
    );
  };

  const toggleCondition = (id: string) => {
    updateCondition(id, { enabled: !conditions.find((c) => c.id === id)?.enabled });
  };

  const getFieldLabel = (fieldName: string) => {
    return fields.find((f) => f.name === fieldName)?.label || fieldName;
  };

  const getFieldType = (fieldName: string): FieldType => {
    return fields.find((f) => f.name === fieldName)?.type || "text";
  };

  const renderValueInput = (condition: FilterCondition) => {
    const fieldType = getFieldType(condition.field);
    const field = fields.find((f) => f.name === condition.field);
    const operator = condition.operator;

    // Operators không cần value
    if (operator === "is_empty" || operator === "is_not_empty") {
      return <div className="text-sm text-gray-500">-</div>;
    }

    // Boolean field
    if (fieldType === "boolean") {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) =>
            updateCondition(condition.id, { value: value === "true" })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Có</SelectItem>
            <SelectItem value="false">Không</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Dropdown field
    if (fieldType === "dropdown" && field?.options) {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => updateCondition(condition.id, { value })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Date field
    if (fieldType === "date") {
      if (operator === "between") {
        const values = String(condition.value).split(",");
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={values[0] || ""}
              onChange={(e) =>
                updateCondition(condition.id, {
                  value: `${e.target.value},${values[1] || ""}`,
                })
              }
              className="w-40"
            />
            <Input
              type="date"
              value={values[1] || ""}
              onChange={(e) =>
                updateCondition(condition.id, {
                  value: `${values[0] || ""},${e.target.value}`,
                })
              }
              className="w-40"
            />
          </div>
        );
      }
      return (
        <Input
          type="date"
          value={String(condition.value)}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="w-40"
        />
      );
    }

    // Datetime field
    if (fieldType === "datetime") {
      if (operator === "between") {
        const values = String(condition.value).split(",");
        return (
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={values[0] || ""}
              onChange={(e) =>
                updateCondition(condition.id, {
                  value: `${e.target.value},${values[1] || ""}`,
                })
              }
              className="w-48"
            />
            <Input
              type="datetime-local"
              value={values[1] || ""}
              onChange={(e) =>
                updateCondition(condition.id, {
                  value: `${values[0] || ""},${e.target.value}`,
                })
              }
              className="w-48"
            />
          </div>
        );
      }
      return (
        <Input
          type="datetime-local"
          value={String(condition.value)}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="w-48"
        />
      );
    }

    // Number field
    if (fieldType === "number") {
      return (
        <Input
          type="number"
          value={String(condition.value)}
          onChange={(e) =>
            updateCondition(condition.id, {
              value: e.target.value ? parseFloat(e.target.value) : 0,
            })
          }
          className="w-32"
        />
      );
    }

    // Text field (default)
    return (
      <Input
        type="text"
        value={String(condition.value)}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        className="w-48"
        placeholder="Nhập giá trị..."
      />
    );
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm bộ lọc
        </Button>
        {conditions.length > 0 && (
          <Button variant="outline" size="sm" onClick={onApply}>
            Áp dụng
          </Button>
        )}
      </div>

      {isOpen && availableFields.length > 0 && (
        <div className="flex gap-2 mb-2 p-2 bg-gray-50 rounded-md">
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn cột để lọc" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={addFilter} disabled={!selectedField}>
            Thêm
          </Button>
        </div>
      )}

      {conditions.length > 0 && (
        <div className="space-y-2">
          {conditions.map((condition) => {
            const fieldType = getFieldType(condition.field);
            const operators = OPERATORS[fieldType] || [];

            return (
              <div
                key={condition.id}
                className={cn(
                  "flex items-center gap-2 p-3 bg-white border rounded-lg",
                  !condition.enabled && "opacity-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={condition.enabled}
                  onChange={() => toggleCondition(condition.id)}
                  className="w-4 h-4"
                />
                <span className="w-32 text-sm font-medium">
                  {getFieldLabel(condition.field)}
                </span>
                <Select
                  value={condition.operator}
                  onValueChange={(value) =>
                    updateCondition(condition.id, { operator: value })
                  }
                  disabled={!condition.enabled}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderValueInput(condition)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(condition.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

