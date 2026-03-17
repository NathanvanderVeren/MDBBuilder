export type CoverStyle = "classic" | "split" | "angled";
export type DividerStyle = "ribbon" | "panel" | "minimal";
export type DocumentFontFamily = "helvetica" | "arial" | "times" | "georgia" | "courier";

export type ProjectDocumentStyle = {
  coverStyle: CoverStyle;
  dividerStyle: DividerStyle;
  fontFamily: DocumentFontFamily;
};

export const DEFAULT_PROJECT_DOCUMENT_STYLE: ProjectDocumentStyle = {
  coverStyle: "classic",
  dividerStyle: "ribbon",
  fontFamily: "helvetica",
};

export const COVER_STYLE_OPTIONS: Array<{
  value: CoverStyle;
  label: string;
  description: string;
}> = [
  {
    value: "classic",
    label: "Classic Grid",
    description: "Structured top banner with clean metadata blocks.",
  },
  {
    value: "split",
    label: "Split Panel",
    description: "Bold vertical panel with an editorial title layout.",
  },
  {
    value: "angled",
    label: "Angled Beam",
    description: "Diagonal color band for a more technical presentation.",
  },
];

export const DIVIDER_STYLE_OPTIONS: Array<{
  value: DividerStyle;
  label: string;
  description: string;
}> = [
  {
    value: "ribbon",
    label: "Ribbon",
    description: "Slim accent strip with large numbering.",
  },
  {
    value: "panel",
    label: "Panel",
    description: "Solid color block with compact metadata framing.",
  },
  {
    value: "minimal",
    label: "Minimal Line",
    description: "Lightweight layout with restrained separators.",
  },
];

export const FONT_FAMILY_OPTIONS: Array<{
  value: DocumentFontFamily;
  label: string;
  previewFamily: string;
}> = [
  {
    value: "helvetica",
    label: "Helvetica",
    previewFamily: '"Helvetica Neue", Arial, sans-serif',
  },
  {
    value: "arial",
    label: "Arial",
    previewFamily: 'Arial, "Helvetica Neue", sans-serif',
  },
  {
    value: "times",
    label: "Times",
    previewFamily: '"Times New Roman", Georgia, serif',
  },
  {
    value: "georgia",
    label: "Georgia",
    previewFamily: 'Georgia, "Times New Roman", serif',
  },
  {
    value: "courier",
    label: "Courier",
    previewFamily: '"Courier New", monospace',
  },
];

export function normalizeProjectDocumentStyle(
  input?: Partial<ProjectDocumentStyle> | null
): ProjectDocumentStyle {
  return {
    coverStyle: isCoverStyle(input?.coverStyle) ? input.coverStyle : DEFAULT_PROJECT_DOCUMENT_STYLE.coverStyle,
    dividerStyle: isDividerStyle(input?.dividerStyle)
      ? input.dividerStyle
      : DEFAULT_PROJECT_DOCUMENT_STYLE.dividerStyle,
    fontFamily: isDocumentFontFamily(input?.fontFamily)
      ? input.fontFamily
      : DEFAULT_PROJECT_DOCUMENT_STYLE.fontFamily,
  };
}

export function getPreviewFontFamily(fontFamily: DocumentFontFamily): string {
  return (
    FONT_FAMILY_OPTIONS.find((option) => option.value === fontFamily)?.previewFamily ||
    FONT_FAMILY_OPTIONS[0].previewFamily
  );
}

export function getPdfFontFamily(fontFamily: DocumentFontFamily): "helvetica" | "times" | "courier" {
  if (fontFamily === "times" || fontFamily === "georgia") return "times";
  if (fontFamily === "courier") return "courier";
  return "helvetica";
}

function isCoverStyle(value: unknown): value is CoverStyle {
  return value === "classic" || value === "split" || value === "angled";
}

function isDividerStyle(value: unknown): value is DividerStyle {
  return value === "ribbon" || value === "panel" || value === "minimal";
}

function isDocumentFontFamily(value: unknown): value is DocumentFontFamily {
  return (
    value === "helvetica" ||
    value === "arial" ||
    value === "times" ||
    value === "georgia" ||
    value === "courier"
  );
}