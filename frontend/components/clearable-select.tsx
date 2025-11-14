"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface ClearableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

function ClearableSelectInner({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className,
  disabled,
  triggerClassName,
}: ClearableSelectProps) {
  const normalizedOptions = useMemo(() => options, [options]);
  const [internalValue, setInternalValue] = useState<string>(value || "");
  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={internalValue}
        onValueChange={(val) => {
          setInternalValue(val);
          // defer propagate to parent to avoid re-render during popup commit phase
          setTimeout(() => onChange(val), 0);
        }}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {internalValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setInternalValue("");
            setTimeout(() => onChange(""), 0);
          }}
          title="Bỏ chọn"
        >
          <X className="w-4 h-4" />
        </Button>
      ) : null}
    </div>
  );
}

export const ClearableSelect = memo(ClearableSelectInner);



