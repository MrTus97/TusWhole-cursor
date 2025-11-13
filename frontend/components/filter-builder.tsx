"use client";

import { useEffect, useRef, useState } from "react";
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
  multiple?: boolean;
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean | null | string[] | number[];
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
  const [openMultiId, setOpenMultiId] = useState<string | null>(null);
  const [searchTextById, setSearchTextById] = useState<Record<string, string>>({});

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

  const MultiDropdown = ({
    conditionId,
    options,
    values,
    onToggleValue,
    placeholder = "Chọn giá trị...",
  }: {
    conditionId: string;
    options: { value: string; label: string }[];
    values: (string | number)[];
    onToggleValue: (value: string) => void;
    placeholder?: string;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isOpen = openMultiId === conditionId;
    const search = searchTextById[conditionId] || "";
    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) {
          setOpenMultiId((id) => (id === conditionId ? null : id));
        }
      };
      if (isOpen) document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [isOpen, conditionId]);

    const selectedValues = (Array.isArray(values) ? values : []) as (string | number)[];
    const selectedSet = new Set(selectedValues.map((v) => String(v)));

    const renderTag = (val: string) => {
      const opt = options.find((o) => o.value === val);
      const label = opt?.label ?? val;
      return (
        <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-gray-100 border rounded">
          {label}
          <button
            type="button"
            className="text-gray-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onToggleValue(val);
            }}
            aria-label={`Remove ${label}`}
          >
            ×
          </button>
        </span>
      );
    };

    return (
      <div className="relative" ref={ref}>
        <div
          role="button"
          tabIndex={0}
          className="min-w-[12rem] max-w-[28rem] flex items-center gap-2 flex-wrap border rounded px-2 py-1 bg-white text-left cursor-pointer"
          onClick={() => setOpenMultiId(isOpen ? null : conditionId)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenMultiId(isOpen ? null : conditionId);
            }
          }}
        >
          {selectedValues.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedValues.map((v) => renderTag(String(v)))
          )}
        </div>
        {isOpen && (
          <div className="absolute z-50 mt-1 w-[28rem] max-w-[90vw] bg-white border rounded shadow">
            <div className="p-2 border-b bg-white sticky top-0">
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) =>
                  setSearchTextById((prev) => ({ ...prev, [conditionId]: e.target.value }))
                }
              />
            </div>
            <div className="max-h-60 overflow-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-2 py-2 text-sm text-gray-500">Không có dữ liệu</div>
              ) : (
                filtered.map((opt) => {
                  const checked = selectedSet.has(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => onToggleValue(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="p-2 border-t flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setOpenMultiId(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
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

    // Dropdown field (multi - select2 style)
    if (fieldType === "dropdown" && field?.options && field?.multiple) {
      const currentValues = Array.isArray(condition.value)
        ? (condition.value as (string | number)[])
        : [];
      const toggleValue = (val: string) => {
        const strVals = currentValues.map((v) => String(v));
        const exists = strVals.includes(val);
        const next = exists ? strVals.filter((v) => v !== val) : [...strVals, val];
        updateCondition(condition.id, { value: next });
      };
      return (
        <MultiDropdown
          conditionId={condition.id}
          options={field.options}
          values={currentValues}
          onToggleValue={toggleValue}
          placeholder="Chọn giá trị..."
        />
      );
    }

    // Dropdown field (single)
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

