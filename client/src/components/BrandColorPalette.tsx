import { Input } from "@/components/ui/input";

export const DEFAULT_BRAND_COLOR_PRESETS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#F97316",
];

type BrandColorPaletteProps = {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
};

export default function BrandColorPalette({
  value,
  onChange,
  presets = DEFAULT_BRAND_COLOR_PRESETS,
}: BrandColorPaletteProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-8 w-8 rounded-md border-2 transition-transform ${
            value.toLowerCase() === color.toLowerCase() ? "border-foreground scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          title={color}
        />
      ))}

      <span className="ml-1 text-xs text-muted-foreground">Custom</span>

      <label
        className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-md border-2 border-border"
        title="Custom color"
      >
        <span className="block h-full w-full" style={{ backgroundColor: value }} />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Custom brand color"
        />
      </label>
    </div>
  );
}
