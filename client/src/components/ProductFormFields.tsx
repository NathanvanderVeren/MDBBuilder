import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UnitNumberingMode } from "@/lib/products";

export interface ProductForm {
  productName: string;
  tagNumber: string;
  mdbDocumentNumber: string;
  unitsEnabled: boolean;
  unitCount: number;
  unitNumberingMode: UnitNumberingMode;
  customUnitNumbers: string[];
}

export function emptyProductForm(): ProductForm {
  return {
    productName: "",
    tagNumber: "",
    mdbDocumentNumber: "",
    unitsEnabled: false,
    unitCount: 1,
    unitNumberingMode: "auto",
    customUnitNumbers: [],
  };
}

export function alignCustomUnitNumbers(values: string[], unitCount: number): string[] {
  const next = [...values].slice(0, unitCount);
  while (next.length < unitCount) next.push("");
  return next;
}

export function parsePastedUnitNumbers(text: string): string[] {
  return text
    .split(/[\r\n\t,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function countEmptyCustomUnitNumbers(form: ProductForm): number {
  if (!form.unitsEnabled || form.unitNumberingMode !== "custom") return 0;
  const unitCount = Math.max(1, Math.min(500, Number(form.unitCount) || 1));
  return alignCustomUnitNumbers(form.customUnitNumbers, unitCount)
    .map((value) => value.trim())
    .filter((value) => !value).length;
}

export function ProductFormFields({
  form,
  onChange,
}: {
  form: ProductForm;
  onChange: (form: ProductForm) => void;
}) {
  const unitCount = Math.max(1, Math.min(500, Number(form.unitCount) || 1));
  const customNumbers = alignCustomUnitNumbers(form.customUnitNumbers, unitCount);
  const showCustomPanel = form.unitsEnabled && form.unitNumberingMode === "custom";
  const emptyCustomUnitCount = customNumbers
    .map((value) => value.trim())
    .filter((value) => !value).length;

  const setUnitCount = (value: number) => {
    const bounded = Math.max(1, Math.min(500, Number(value) || 1));
    onChange({
      ...form,
      unitCount: bounded,
      customUnitNumbers: alignCustomUnitNumbers(form.customUnitNumbers, bounded),
    });
  };

  const setUnitNumberAt = (index: number, value: string) => {
    const next = alignCustomUnitNumbers(form.customUnitNumbers, unitCount);
    next[index] = value;
    onChange({ ...form, customUnitNumbers: next });
  };

  const handleUnitPasteAt = (startIndex: number, text: string) => {
    const values = parsePastedUnitNumbers(text);
    if (values.length <= 1) return false;

    const next = alignCustomUnitNumbers(form.customUnitNumbers, unitCount);
    values.forEach((value, offset) => {
      const idx = startIndex + offset;
      if (idx < next.length) next[idx] = value;
    });
    onChange({ ...form, customUnitNumbers: next });
    return true;
  };

  return (
    <div className={`py-1 ${showCustomPanel ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]" : "space-y-4"}`}>
      <div className="space-y-4">
        <div>
          <Label className="text-sm mb-1.5 block">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.productName}
            onChange={(e) => onChange({ ...form, productName: e.target.value })}
            placeholder="e.g. Pressure Vessel V-4501"
            className="bg-input/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm mb-1.5 block">Tag Number</Label>
            <Input
              value={form.tagNumber}
              onChange={(e) => onChange({ ...form, tagNumber: e.target.value })}
              placeholder="e.g. V-4501"
              className="bg-input/50 font-[var(--font-mono)]"
            />
            <p className="text-xs text-muted-foreground mt-1">Optional</p>
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">MDB Document Number</Label>
            <Input
              value={form.mdbDocumentNumber}
              onChange={(e) => onChange({ ...form, mdbDocumentNumber: e.target.value })}
              placeholder="e.g. MDB-2024-001"
              className="bg-input/50 font-[var(--font-mono)]"
            />
            <p className="text-xs text-muted-foreground mt-1">Optional</p>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm">Deliver in multiple units</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use this when one product MDB package is delivered for multiple units.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.unitsEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                onChange({
                  ...form,
                  unitsEnabled: enabled,
                  unitCount: enabled ? unitCount : 1,
                  unitNumberingMode: enabled ? form.unitNumberingMode : "auto",
                  customUnitNumbers: enabled
                    ? alignCustomUnitNumbers(form.customUnitNumbers, unitCount)
                    : [],
                });
              }}
              className="h-4 w-4 rounded border-input"
            />
          </div>

          {form.unitsEnabled && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1.5 block">Total Units</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={unitCount}
                    onChange={(e) => setUnitCount(Number(e.target.value))}
                    className="bg-input/50"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Numbering Mode</Label>
                  <select
                    value={form.unitNumberingMode}
                    onChange={(e) => {
                      const mode = e.target.value as UnitNumberingMode;
                      onChange({
                        ...form,
                        unitNumberingMode: mode,
                        customUnitNumbers:
                          mode === "custom"
                            ? alignCustomUnitNumbers(form.customUnitNumbers, unitCount)
                            : [],
                      });
                    }}
                    className="w-full h-10 rounded-md border border-input bg-input/50 px-3 text-sm"
                  >
                    <option value="auto">Auto (1 to N)</option>
                    <option value="custom">Custom (per unit)</option>
                  </select>
                </div>
              </div>

              {form.unitNumberingMode === "auto" && (
                <p className="text-xs text-muted-foreground">
                  Units will be numbered from 1 to {unitCount}.
                </p>
              )}

              {form.unitNumberingMode === "custom" && (
                <p className="text-xs text-muted-foreground">
                  Custom unit numbers are shown in the panel on the right.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {showCustomPanel && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Custom Unit Numbers</Label>
            <span
              className={`text-xs font-medium ${
                emptyCustomUnitCount > 0 ? "text-orange-600" : "text-muted-foreground"
              }`}
            >
              {emptyCustomUnitCount} empty
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: copy from Excel and paste directly into the first empty unit field below.
          </p>
          <div className="max-h-[380px] overflow-auto pr-1 space-y-1.5">
            {customNumbers.map((value, index) => (
              <div key={index} className="grid grid-cols-[86px_1fr] gap-2 items-center">
                <span className="text-xs text-muted-foreground">Unit {index + 1}</span>
                <Input
                  value={value}
                  onChange={(e) => setUnitNumberAt(index, e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (handleUnitPasteAt(index, text)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={`e.g. DBG-1021-AT-${String(index + 1).padStart(3, "0")}`}
                  className={`bg-input/50 font-[var(--font-mono)] ${
                    value.trim() ? "" : "border-orange-400 focus-visible:ring-orange-400/40"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
