"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

interface AmountInputProps {
	value: string | number;
	onChange: (rawValue: string) => void;
	currency?: string; // e.g. "VND", default VND
	decimals?: number; // allowed decimal places, default 2
	allowNegative?: boolean;
	className?: string;
	placeholder?: string;
	disabled?: boolean;
	name?: string;
	id?: string;
}

/**
 * AmountInput
 * - Hiển thị phân tách hàng nghìn trong lúc nhập
 * - Clear type an toàn, chỉ giữ số và 1 dấu thập phân
 * - Nếu không truyền currency -> mặc định VND
 * - onChange trả về raw numeric string (ví dụ "12345.67" hoặc "")
 */
export function AmountInput({
	value,
	onChange,
	currency = "VND",
	decimals = 2,
	allowNegative = false,
	className,
	placeholder,
	disabled,
	name,
	id,
}: AmountInputProps) {
	const [displayValue, setDisplayValue] = useState<string>("");
	const selectionRef = useRef<number | null>(null);

	const normalized = useMemo(() => {
		if (value === null || value === undefined) return "";
		const str = String(value);
		return str;
	}, [value]);

	useEffect(() => {
		// Cập nhật display từ raw
		if (normalized === "") {
			setDisplayValue("");
			return;
		}
		const formatted = formatWithGrouping(normalized, decimals);
		setDisplayValue(formatted);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [normalized, decimals]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		// Lấy vị trí caret hiện tại để giữ sau khi format lại
		const selStart = e.target.selectionStart ?? null;
		selectionRef.current = selStart;

		// Sanitize input -> raw
		const raw = sanitizeToRawNumber(input, { decimals, allowNegative });
		onChange(raw);

		// Tự format hiển thị
		const formatted = formatWithGrouping(raw, decimals);
		setDisplayValue(formatted);
	};

	const handleBlur = () => {
		// Chuẩn hoá số thập phân theo số digits yêu cầu (không ép phải có phần thập phân)
		if (!displayValue) return;
		const raw = sanitizeToRawNumber(displayValue, { decimals, allowNegative });
		const formatted = formatWithGrouping(raw, decimals);
		setDisplayValue(formatted);
	};

	return (
		<div className="relative flex items-center">
			<Input
				id={id}
				name={name}
				disabled={disabled}
				className={cn("pr-14", className)}
				inputMode="decimal"
				placeholder={placeholder ?? "0"}
				value={displayValue}
				onChange={handleChange}
				onBlur={handleBlur}
			/>
			<span className="absolute right-2 text-sm text-gray-500 select-none">
				{currency || "VND"}
			</span>
		</div>
	);
}

function sanitizeToRawNumber(input: string, opts: { decimals: number; allowNegative: boolean }): string {
	const { decimals, allowNegative } = opts;
	let s = input.trim();
	if (s === "") return "";

	// Loại bỏ dấu phân cách hàng nghìn (,) do component render thêm vào
	// Không đổi dấu , thành . để tránh biến dấu phẩy thành dấu chấm
	s = s.replace(/,/g, "");

	// Loại ký tự không hợp lệ ngoài chữ số, dấu . và (tuỳ chọn) dấu -
	const regex = allowNegative ? /[^0-9\.\-]/g : /[^0-9\.]/g;
	s = s.replace(regex, "");

	// Xử lý nhiều dấu -: chỉ cho phép ở đầu
	if (allowNegative) {
		const negParts = s.split("-");
		if (negParts.length > 2) {
			s = (negParts[0] === "" ? "-" : "") + negParts.join("");
		}
		if (s.lastIndexOf("-") > 0) {
			s = s.replace(/-/g, "");
			s = "-" + s;
		}
	} else {
		s = s.replace(/-/g, "");
	}

	// Chỉ giữ 1 dấu .
	const parts = s.split(".");
	if (parts.length > 2) {
		s = parts.shift() + "." + parts.join("");
	}

	// Giới hạn số chữ số thập phân
	if (decimals >= 0 && s.includes(".")) {
		const [intPart, decPart] = s.split(".");
		s = intPart + "." + decPart.slice(0, decimals);
	}

	// Không ép loại bỏ toàn bộ leading zeros để tránh giật số khi đang gõ nhiều số 0

	return s;
}

function formatWithGrouping(raw: string, decimals: number): string {
	if (!raw) return "";
	const negative = raw.startsWith("-");
	const n = negative ? raw.slice(1) : raw;
	const [i, d] = n.split(".");
	// Dùng en-US để có dấu phẩy ngăn cách hàng nghìn
	const grouped = Number(i || "0").toLocaleString("en-US");
	const dec = typeof d === "string" && d.length > 0 ? "." + d : "";
	return (negative ? "-" : "") + grouped + dec;
}


