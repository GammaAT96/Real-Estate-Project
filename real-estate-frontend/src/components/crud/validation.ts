import type { FieldDef } from "@/components/CRUDPage";

export function runBuiltInValidation(field: FieldDef, value: unknown): string | undefined {
  if (field.required && (value === "" || value === null || value === undefined)) {
    return `${field.label} is required`;
  }

  if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return "Enter a valid email address";
  }

  if (field.type === "number" && field.min !== undefined && Number(value) < field.min) {
    return `${field.label} must be at least ${field.min}`;
  }

  if (field.type === "number" && value !== "" && Number.isNaN(Number(value))) {
    return `${field.label} must be a number`;
  }

  return undefined;
}

export function validateField(
  field: FieldDef,
  value: unknown,
  formData: Record<string, unknown>
): string | undefined {
  const builtIn = runBuiltInValidation(field, value);
  if (builtIn) return builtIn;
  return field.validate?.(value, formData as Record<string, any>);
}

