import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldDef } from "@/components/CRUDPage";
import { FieldError } from "@/components/crud/FieldError";

export function CrudDialog({
  open,
  onOpenChange,
  title,
  formFields,
  formData,
  touched,
  fieldErrors,
  submitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  onFieldChange,
  onFieldBlur,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formFields: FieldDef[];
  formData: Record<string, any>;
  touched: Record<string, boolean>;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFieldChange: (fieldName: string, value: any) => void;
  onFieldBlur: (fieldName: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {formFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>

              {field.type === "select" ? (
                <>
                  <Select
                    value={formData[field.name] || ""}
                    onValueChange={(v) => {
                      onFieldChange(field.name, v);
                      onFieldBlur(field.name);
                    }}
                  >
                    <SelectTrigger
                      className={
                        touched[field.name] && fieldErrors[field.name]
                          ? "border-red-400 focus:ring-red-400"
                          : ""
                      }
                    >
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched[field.name] && <FieldError message={fieldErrors[field.name]} />}
                </>
              ) : field.type === "textarea" ? (
                <>
                  <textarea
                    id={field.name}
                    className={`w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm resize-none transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${
                      touched[field.name] && fieldErrors[field.name]
                        ? "border-red-400 focus:ring-red-400"
                        : "border-input"
                    }`}
                    value={formData[field.name] || ""}
                    onChange={(e) => onFieldChange(field.name, e.target.value)}
                    onBlur={() => onFieldBlur(field.name)}
                    placeholder={field.placeholder}
                  />
                  {touched[field.name] && <FieldError message={fieldErrors[field.name]} />}
                </>
              ) : (
                <>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] ?? ""}
                    placeholder={field.placeholder}
                    className={
                      touched[field.name] && fieldErrors[field.name]
                        ? "border-red-400 focus-visible:ring-red-400"
                        : ""
                    }
                    onChange={(e) =>
                      onFieldChange(
                        field.name,
                        field.type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : e.target.value
                      )
                    }
                    onBlur={() => onFieldBlur(field.name)}
                  />
                  {touched[field.name] && <FieldError message={fieldErrors[field.name]} />}
                </>
              )}
            </div>
          ))}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {submittingLabel}
                </span>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

