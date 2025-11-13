import { FilterCondition } from "@/components/filter-builder";

/**
 * Chuyển đổi filter conditions thành query params cho Django REST Framework
 */
export function buildFilterParams(conditions: FilterCondition[]): Record<string, any> {
  const params: Record<string, any> = {};
  
  const enabledConditions = conditions.filter((c) => c.enabled);
  
  for (const condition of enabledConditions) {
    const { field, operator, value } = condition;
    
    // Skip nếu operator không cần value
    if (operator === "is_empty" || operator === "is_not_empty") {
      // Django filter: field__isnull
      if (operator === "is_empty") {
        params[`${field}__isnull`] = "true";
      } else {
        params[`${field}__isnull`] = "false";
      }
      continue;
    }
    
    // Skip nếu không có value
    if (value === null || value === undefined || value === "") {
      continue;
    }
    
    // Map operators to Django filter lookups
    // Note: not_contains and not_equals will be handled by backend using Q objects
    const lookupMap: Record<string, string> = {
      contains: "icontains",
      not_contains: "not_icontains", // Will be handled specially
      starts_with: "istartswith",
      ends_with: "iendswith",
      equals: "",
      not_equals: "not_exact", // Will be handled specially
      greater_than: "gt",
      less_than: "lt",
      greater_or_equal: "gte",
      less_or_equal: "lte",
      between: "range",
    };
    
    const lookup = lookupMap[operator] || "";
    
    if (operator === "between") {
      // Value format: "value1,value2"
      const values = String(value).split(",");
      if (values.length === 2 && values[0] && values[1]) {
        // Django range expects two separate values
        params[`${field}__gte`] = values[0];
        params[`${field}__lte`] = values[1];
      }
    } else if (Array.isArray(value)) {
      // Multi-select: equals -> __in, not_equals -> __not__in
      const list = (value as (string | number)[]).join(",");
      if (operator === "not_equals") {
        params[`${field}__not__in`] = list;
      } else {
        params[`${field}__in`] = list;
      }
    } else if (lookup === "") {
      // Exact match
      params[field] = value;
    } else if (lookup.startsWith("not_")) {
      // For exclude operations, use special format that backend can recognize
      const actualLookup = lookup.replace("not_", "");
      params[`${field}__not__${actualLookup}`] = value;
    } else {
      params[`${field}__${lookup}`] = value;
    }
  }
  
  return params;
}

/**
 * Chuyển đổi filter conditions thành URL query string
 */
export function buildFilterQueryString(conditions: FilterCondition[]): string {
  const params = buildFilterParams(conditions);
  const queryString = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      queryString.append(key, String(value));
    }
  }
  
  return queryString.toString();
}

/**
 * Parse URL query params thành filter conditions
 */
export function parseFilterFromQuery(
  searchParams: URLSearchParams,
  fields: Array<{ name: string; type: string }>
): FilterCondition[] {
  const conditions: FilterCondition[] = [];
  const processedFields = new Set<string>();
  
  // Parse các filter params từ URL
  for (const [key, value] of searchParams.entries()) {
    if (!value) continue;
    
    // Parse field name và operator từ key
    // Format: field__operator hoặc field__not__operator
    let fieldName = "";
    let operator = "";
    
    if (key.includes("__not__")) {
      const parts = key.split("__not__");
      fieldName = parts[0];
      operator = "not_" + parts[1];
    } else if (key.includes("__")) {
      const parts = key.split("__");
      fieldName = parts[0];
      operator = parts.slice(1).join("__");
    } else {
      fieldName = key;
      operator = "equals";
    }
    
    // Map Django lookup về operator của chúng ta
    const operatorMap: Record<string, string> = {
      icontains: "contains",
      istartswith: "starts_with",
      iendswith: "ends_with",
      gt: "greater_than",
      lt: "less_than",
      gte: "greater_or_equal",
      lte: "less_or_equal",
      isnull: value === "true" ? "is_empty" : "is_not_empty",
      not_icontains: "not_contains",
      not_exact: "not_equals",
      in: "equals",
      not_in: "not_equals",
    };
    
    if (operator === "isnull") {
      operator = operatorMap["isnull"] || (value === "true" ? "is_empty" : "is_not_empty");
    } else {
      operator = operatorMap[operator] || operator || "equals";
    }
    
    // Tìm field type
    const field = fields.find((f) => f.name === fieldName);
    if (!field) continue;
    
    // Xử lý between (có 2 params: gte và lte)
    if (operator === "greater_or_equal" && !processedFields.has(fieldName)) {
      const lteValue = searchParams.get(`${fieldName}__lte`);
      if (lteValue) {
        conditions.push({
          id: Date.now().toString() + Math.random(),
          field: fieldName,
          operator: "between",
          value: `${value},${lteValue}`,
          enabled: true,
        });
        processedFields.add(fieldName);
        processedFields.add(`${fieldName}__lte`);
        continue;
      }
    }
    
    // Skip nếu đã xử lý (cho between case)
    if (processedFields.has(fieldName) || processedFields.has(key)) continue;
    
    // Parse value theo field type
    let parsedValue: any = value;
    if (field.type === "number") {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) continue;
    } else if (field.type === "boolean") {
      parsedValue = value === "true";
    } else if (key.endsWith("__in")) {
      // Multi-select parse
      parsedValue = String(value).split(",").filter(Boolean);
    } else if (field.type === "date" || field.type === "datetime") {
      // Giữ nguyên string value cho date/datetime
      parsedValue = value;
    }
    
    conditions.push({
      id: Date.now().toString() + Math.random(),
      field: fieldName,
      operator: operator,
      value: parsedValue,
      enabled: true,
    });
    
    processedFields.add(fieldName);
    processedFields.add(key);
  }
  
  return conditions;
}
