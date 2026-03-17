/**
 * PDF Generator for MDB Builder
 * Generates a professional PDF with cover page, TOC, section dividers, and bookmarks
 * Uses jsPDF for client-side PDF generation
 */
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import {
  getPdfFontFamily,
  normalizeProjectDocumentStyle,
  type ProjectDocumentStyle,
} from "./document-styles";
import type { MdbSection, ProjectInfo, SectionCategory } from "./mdb-data";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./mdb-data";

interface MdbState {
  info: ProjectInfo;
  sections: MdbSection[];
  chapterOrder: SectionCategory[];
  chapterMeta: Record<SectionCategory, { title: string; color: string }>;
  logoUrl: string | null;
  primaryColor: string;
  brandingData?: {
    companyName?: string;
  };
  projectData?: {
    projectNumber?: string;
    projectName?: string;
    customerName?: string;
    customerProjectNumber?: string;
  };
  productData?: {
    productName?: string;
    tagNumber?: string;
    mdbDocumentNumber?: string;
  };
  unitNumber?: string;
  documentStyle?: ProjectDocumentStyle;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [59, 130, 246]; // default blue
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

type ExportItem = {
  title: string;
  pageNumbers: number[];
};

export type PdfZipEntry = {
  filename: string;
  bytes: Uint8Array;
};

function sanitizeFileName(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/g, "");
  return sanitized || "sheet";
}

function makeUniqueFileName(base: string, seen: Map<string, number>): string {
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  if (count === 1) return base;
  return `${base} (${count})`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function nonEmpty(value?: string): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function drawLogoContained(
  doc: jsPDF,
  logoUrl: string,
  box: { x: number; y: number; width: number; height: number },
  options?: { align?: "left" | "center" | "right" }
) {
  try {
    const props = doc.getImageProperties(logoUrl);
    const srcWidth = Number(props.width) || 1;
    const srcHeight = Number(props.height) || 1;
    const scale = Math.min(box.width / srcWidth, box.height / srcHeight);
    const drawWidth = Math.max(0.1, srcWidth * scale);
    const drawHeight = Math.max(0.1, srcHeight * scale);

    let drawX = box.x;
    if (options?.align === "right") {
      drawX = box.x + box.width - drawWidth;
    } else if (options?.align === "center") {
      drawX = box.x + (box.width - drawWidth) / 2;
    }
    const drawY = box.y + (box.height - drawHeight) / 2;

    doc.addImage(logoUrl, "PNG", drawX, drawY, drawWidth, drawHeight, undefined, "FAST");
  } catch {
    // ignore invalid branding image
  }
}

function buildPdfDocument(state: MdbState): { doc: jsPDF; exportItems: ExportItem[] } {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const documentStyle = normalizeProjectDocumentStyle(state.documentStyle);
  const primaryFont = getPdfFontFamily(documentStyle.fontFamily);
  const primaryRgb = hexToRgb(state.primaryColor);
  const brandingCompanyName = nonEmpty(state.brandingData?.companyName);
  const drawPageBranding = (options?: { dark?: boolean; includeLogo?: boolean }) => {
      const hasBranding = !!state.logoUrl || !!brandingCompanyName;
      if (!hasBranding) return;

      const textColor = options?.dark ? [230, 230, 230] : [90, 90, 90];
      const topY = 12;
      let rightEdge = pageWidth - margin;
      const includeLogo = options?.includeLogo !== false;
      const logoBox = { x: rightEdge - 24, y: topY - 1, width: 24, height: 10 };
      const textBaselineY =
        includeLogo && state.logoUrl
          ? logoBox.y + logoBox.height / 2 + 2.5
          : topY + 4;

      if (includeLogo && state.logoUrl) {
        drawLogoContained(
          doc,
          state.logoUrl,
          logoBox,
          { align: "right" }
        );
        rightEdge -= 24 + 4;
      }

      if (brandingCompanyName) {
        doc.setFont(primaryFont, "bold");
        doc.setFontSize(8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(brandingCompanyName, rightEdge, textBaselineY, { align: "right" });
      }
    };

  const indexSection = state.sections.find((section) => section.id === "mdb-index");
  const nonIndexSections = state.sections.filter((section) => section.id !== "mdb-index");
  const orderedSubChapters = state.chapterOrder.flatMap((category) =>
    nonIndexSections.filter((section) => section.category === category)
  );

  type SectionMeta = {
    section: MdbSection;
    label: string;
    mainChapterName: string;
    chapterColor: [number, number, number];
  };

  type ChapterMeta = {
    category: SectionCategory;
    label: string;
    title: string;
    color: [number, number, number];
    sections: SectionMeta[];
  };

  type TocRow = {
    kind: "index" | "chapter" | "subchapter";
    label: string;
    title: string;
    code?: string;
  };

  const chapterMetas: ChapterMeta[] = [];
  const tocRows: TocRow[] = [];
  const tocPages: number[] = [];
  const chapterPageMap = new Map<SectionCategory, number>();
  const chapterSectionPageMap = new Map<
    SectionCategory,
    Array<{ label: string; title: string; pageNumber: number }>
  >();

  let coverPageNumber = 1;
  let finalPageNumber = 1;

  if (indexSection) {
    tocRows.push({
      kind: "index",
      label: "IDX",
      title: indexSection.title,
      code: indexSection.code,
    });
  }

  let mainChapterNumber = 0;

  state.chapterOrder.forEach((category) => {
    const chapterSections = orderedSubChapters.filter(
      (section) => section.category === category
    );
    const chapterTitle =
      state.chapterMeta[category]?.title || CATEGORY_LABELS[category] || category;
    const chapterColor = hexToRgb(
      state.chapterMeta[category]?.color ||
        CATEGORY_COLORS[category] ||
        state.primaryColor
    );

    mainChapterNumber += 1;
    tocRows.push({
      kind: "chapter",
      label: String(mainChapterNumber),
      title: chapterTitle,
    });

    const chapterMeta: ChapterMeta = {
      category,
      label: String(mainChapterNumber),
      title: chapterTitle,
      color: chapterColor,
      sections: [],
    };

    chapterSectionPageMap.set(category, []);

    chapterSections.forEach((section, subIndex) => {
      chapterMeta.sections.push({
        section,
        label: `${mainChapterNumber}.${subIndex + 1}`,
        mainChapterName: chapterTitle,
        chapterColor,
      });

      tocRows.push({
        kind: "subchapter",
        label: `${mainChapterNumber}.${subIndex + 1}`,
        title: section.title,
        code: section.code,
      });
    });

    chapterMetas.push(chapterMeta);
  });

  // ===== COVER PAGE =====
  coverPageNumber = doc.getNumberOfPages();

  let y = 108;

  if (documentStyle.coverStyle === "split") {
    doc.setFillColor(...primaryRgb);
    doc.rect(0, 0, 58, pageHeight, "F");

    if (brandingCompanyName) {
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(brandingCompanyName, 14, 24);
    }

    doc.setFont(primaryFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("Manufacturing", 14, 95);
    doc.text("Data Book", 14, 103);

    if (state.logoUrl) {
      drawLogoContained(
        doc,
        state.logoUrl,
        {
          x: pageWidth - margin - 58,
          y: 18,
          width: 58,
          height: 22,
        },
        { align: "right" }
      );
    }

    doc.setFont(primaryFont, "bold");
    doc.setFontSize(28);
    doc.setTextColor(25, 25, 25);
    doc.text("Manufacturing", 72, 76);
    doc.text("Data Book", 72, 92);

    doc.setDrawColor(...primaryRgb);
    doc.setLineWidth(1.2);
    doc.line(72, 102, pageWidth - margin, 102);
    y = 118;
  } else if (documentStyle.coverStyle === "angled") {
    // Match the preview card: one rotated rectangle clipped by the page edge.
    doc.setFillColor(...primaryRgb);
    const angle = (-20 * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const width = 126;
    const height = 64;

    // Anchor the shape so it overhangs top-right, like the thumbnail preview.
    const x = pageWidth - 118;
    const yTop = -6;

    const ux = width * cos;
    const uy = width * sin;
    const vx = -height * sin;
    const vy = height * cos;

    // Four corners of one rotated rectangle.
    const p1x = x;
    const p1y = yTop;
    const p2x = p1x + ux;
    const p2y = p1y + uy;
    const p3x = p2x + vx;
    const p3y = p2y + vy;
    const p4x = p1x + vx;
    const p4y = p1y + vy;

    doc.lines(
      [
        [p2x - p1x, p2y - p1y],
        [p3x - p2x, p3y - p2y],
        [p4x - p3x, p4y - p3y],
      ],
      p1x,
      p1y,
      [1, 1],
      "F",
      true
    );

    if (state.logoUrl) {
      drawLogoContained(
        doc,
        state.logoUrl,
        {
          x: pageWidth - margin - 54,
          y: 10,
          width: 54,
          height: 20,
        },
        { align: "right" }
      );
    }

    doc.setFont(primaryFont, "bold");
    doc.setFontSize(31);
    doc.setTextColor(30, 30, 30);
    doc.text("Manufacturing", margin, 72);
    doc.text("Data Book", margin, 89);

    if (brandingCompanyName) {
      doc.setFont(primaryFont, "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(brandingCompanyName, margin, 101);
    }

    y = 124;
  } else {
    doc.setFillColor(...primaryRgb);
    doc.rect(0, 0, pageWidth, 40, "F");

    if (state.logoUrl) {
      drawLogoContained(
        doc,
        state.logoUrl,
        {
          x: pageWidth - margin - 62,
          y: 42,
          width: 62,
          height: 24,
        },
        { align: "right" }
      );
    }
    if (brandingCompanyName) {
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(brandingCompanyName, pageWidth - margin, 22, { align: "right" });
    }

    doc.setFont(primaryFont, "bold");
    doc.setFontSize(32);
    doc.setTextColor(30, 30, 30);
    doc.text("Manufacturing", margin, 75);
    doc.text("Data Book", margin, 90);
  }

  doc.setFontSize(11);
  doc.setFont(primaryFont, "normal");
  doc.setTextColor(100, 100, 100);

  const projectRows: Array<[string, string]> = [
    ["Project Number", nonEmpty(state.projectData?.projectNumber) || ""],
    ["Project Name", nonEmpty(state.projectData?.projectName) || nonEmpty(state.info.projectName) || ""],
    ["Customer", nonEmpty(state.projectData?.customerName) || nonEmpty(state.info.clientName) || ""],
    ["Customer Project Number", nonEmpty(state.projectData?.customerProjectNumber) || ""],
  ].filter((row): row is [string, string] => !!row[1]);

  const productRows: Array<[string, string]> = [
    ["Product Name", nonEmpty(state.productData?.productName) || ""],
    ["Tag Number", nonEmpty(state.productData?.tagNumber) || ""],
    [
      "MDB Document Number",
      nonEmpty(state.productData?.mdbDocumentNumber) || nonEmpty(state.info.documentNumber) || "",
    ],
  ].filter((row): row is [string, string] => !!row[1]);

  const unitNumberValue = nonEmpty(state.unitNumber);
  const dividerProjectParts = [
    nonEmpty(state.projectData?.projectNumber) ? `No: ${nonEmpty(state.projectData?.projectNumber)}` : null,
    nonEmpty(state.projectData?.projectName) || nonEmpty(state.info.projectName)
      ? `Name: ${nonEmpty(state.projectData?.projectName) || nonEmpty(state.info.projectName)}`
      : null,
    nonEmpty(state.projectData?.customerName) || nonEmpty(state.info.clientName)
      ? `Customer: ${nonEmpty(state.projectData?.customerName) || nonEmpty(state.info.clientName)}`
      : null,
    nonEmpty(state.projectData?.customerProjectNumber)
      ? `Cust. No: ${nonEmpty(state.projectData?.customerProjectNumber)}`
      : null,
  ].filter((value): value is string => !!value);

  const dividerProductParts = [
    nonEmpty(state.productData?.productName)
      ? `Product: ${nonEmpty(state.productData?.productName)}`
      : null,
    nonEmpty(state.productData?.tagNumber)
      ? `Tag: ${nonEmpty(state.productData?.tagNumber)}`
      : null,
    nonEmpty(state.productData?.mdbDocumentNumber) || nonEmpty(state.info.documentNumber)
      ? `Doc: ${nonEmpty(state.productData?.mdbDocumentNumber) || nonEmpty(state.info.documentNumber)}`
      : null,
    unitNumberValue ? `Unit: ${unitNumberValue}` : null,
  ].filter((value): value is string => !!value);

  const drawDividerMetadata = () => {
    if (dividerProjectParts.length === 0 && dividerProductParts.length === 0) return;

    const blockY = pageHeight - 36;
    const blockHeight = 16;
    const colGap = 3;
    const colWidth = (contentWidth - colGap) / 2;

    const drawCol = (title: string, parts: string[], x: number) => {
      if (parts.length === 0) return;
      doc.setDrawColor(232, 232, 232);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, blockY, colWidth, blockHeight, 1.5, 1.5, "FD");

      doc.setFont(primaryFont, "bold");
      doc.setFontSize(7);
      doc.setTextColor(145, 145, 145);
      doc.text(title, x + 2, blockY + 4.5);

      doc.setFont(primaryFont, "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(105, 105, 105);
      const line = parts.join("  |  ");
      const wrapped = doc.splitTextToSize(line, colWidth - 4).slice(0, 2);
      doc.text(wrapped, x + 2, blockY + 8.5);
    };

    drawCol("PROJECT", dividerProjectParts, margin);
    drawCol("PRODUCT", dividerProductParts, margin + colWidth + colGap);
  };

  const drawInfoBlock = (
    title: string,
    rows: Array<[string, string]>,
    startY: number,
    highlight?: { label: string; value: string }
  ) => {
    if (rows.length === 0 && !highlight) return startY;

    const lineHeight = 6.5;
    const innerPaddingTop = 8;
    const innerPaddingBottom = 6;
    const titleGap = 4;
    const highlightHeight = highlight ? 8.5 : 0;
    const blockHeight =
      innerPaddingTop + titleGap + highlightHeight + rows.length * lineHeight + innerPaddingBottom;

    doc.setDrawColor(222, 226, 232);
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(margin, startY, contentWidth, blockHeight, 2, 2, "FD");

    let currentY = startY + innerPaddingTop;
    doc.setFont(primaryFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primaryRgb);
    doc.text(title, margin + 8, currentY);
    currentY += titleGap;

    if (highlight) {
      currentY += 4;
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`${highlight.label}:`, margin + 8, currentY);
      doc.setFont("courier", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(highlight.value, margin + 52, currentY);
      currentY += 4.5;
    }

    rows.forEach(([label, value]) => {
      currentY += lineHeight;
      doc.setFont(primaryFont, "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(105, 105, 105);
      doc.text(`${label}:`, margin + 8, currentY);
      doc.setFont(primaryFont, "normal");
      doc.setTextColor(25, 25, 25);
      doc.text(value, margin + 52, currentY);
    });

    return startY + blockHeight + 7;
  };

  y = drawInfoBlock("Project Data", projectRows, y);
  y = drawInfoBlock(
    "Product Data",
    productRows,
    y,
    unitNumberValue ? { label: "Unit Number", value: unitNumberValue } : undefined
  );

  // Divider line
  doc.setDrawColor(...primaryRgb);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 5, pageWidth - margin, y + 5);

  // ===== TABLE OF CONTENTS PAGES =====
  doc.addPage();
  let tocPageNumber = 1;
  tocPages.push(doc.getNumberOfPages());

  const drawTocHeader = (isFirstPage: boolean): number => {
    let tocY = 18;

    drawPageBranding();

    doc.setFont(primaryFont, "bold");
    doc.setFontSize(14);
    doc.setTextColor(...primaryRgb);
    doc.text("INDEX / TABLE OF CONTENTS", margin, tocY);
    tocY += 7;

    if (isFirstPage) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, tocY, pageWidth - margin, tocY);
      tocY += 5;

      doc.setFont(primaryFont, "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);

      const tocProjectName =
        nonEmpty(state.projectData?.projectName) || nonEmpty(state.info.projectName) || "-";
      const tocCustomerName =
        nonEmpty(state.projectData?.customerName) || nonEmpty(state.info.clientName) || "-";
      const tocDocumentNumber =
        nonEmpty(state.productData?.mdbDocumentNumber) || nonEmpty(state.info.documentNumber) || "-";
      const tocUnit = nonEmpty(state.unitNumber);

      doc.text(
        `Project: ${tocProjectName}   |   Client: ${tocCustomerName}`,
        margin,
        tocY
      );
      tocY += 4.5;
      doc.text(
        `Doc No.: ${tocDocumentNumber}${tocUnit ? `   |   Unit: ${tocUnit}` : ""}   |   Rev: ${state.info.revision}   |   Date: ${state.info.date}`,
        margin,
        tocY
      );
      tocY += 5;

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, tocY, pageWidth - margin, tocY);
      tocY += 5;
    } else {
      tocY += 2;
    }

    return tocY;
  };

  y = drawTocHeader(true);

  // TOC entries with hierarchy
  doc.setFontSize(10);
  for (let i = 0; i < tocRows.length; i++) {
    const row = tocRows[i];
    const needsChapterGap =
      row.kind === "chapter" && i > 0 && tocRows[i - 1].kind === "subchapter";
    if (needsChapterGap) {
      y += 3; // visual blank line between chapter groups
    }
    const rowHeight = row.kind === "chapter" ? 6 : 5;
    if (y > pageHeight - 15) {
      doc.addPage();
      tocPageNumber += 1;
      tocPages.push(doc.getNumberOfPages());
      y = drawTocHeader(false);
    }

    const isSubchapter = row.kind === "subchapter";
    const labelX = isSubchapter ? margin + 2 : margin;
    const codeX = isSubchapter ? margin + 14 : margin + 10;
    const titleX = isSubchapter ? margin + 28 : margin + 22;

    doc.setFont(primaryFont, row.kind === "chapter" ? "bold" : "normal");
    doc.setTextColor(row.kind === "chapter" ? 55 : 100, row.kind === "chapter" ? 55 : 100, row.kind === "chapter" ? 55 : 100);
    doc.text(row.label, labelX, y);

    if (row.code) {
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(row.code, codeX, y);
    }

    doc.setFont(primaryFont, row.kind === "chapter" ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(row.title, titleX, y);

    // Dots
    const titleWidth = doc.getTextWidth(row.title);
    const dotsStart = titleX + titleWidth + 2;
    const dotsEnd = pageWidth - margin - 8;
    if (dotsStart < dotsEnd) {
      doc.setTextColor(200, 200, 200);
      const dots = ".".repeat(
        Math.floor((dotsEnd - dotsStart) / doc.getTextWidth("."))
      );
      doc.text(dots, dotsStart, y);
    }

    y += rowHeight;
  }

  // ===== SECTION DIVIDER PAGES =====
  for (let i = 0; i < chapterMetas.length; i++) {
    const chapter = chapterMetas[i];

    if (chapter.sections.length === 0) {
      doc.addPage();
      chapterPageMap.set(chapter.category, doc.getNumberOfPages());
      const titleLines = doc.splitTextToSize(chapter.title, contentWidth - 20);

      if (documentStyle.dividerStyle === "panel") {
        doc.setFillColor(...chapter.color);
        doc.rect(0, 0, pageWidth, 86, "F");

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(42);
        doc.setTextColor(255, 255, 255);
        doc.text(chapter.label, margin, 48);

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(24);
        doc.text(titleLines, margin, 69);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("Main Chapter", margin, 80);
      } else if (documentStyle.dividerStyle === "minimal") {
        doc.setFillColor(...chapter.color);
        doc.rect(margin, 28, contentWidth, 1.5, "F");
        doc.rect(margin, 44, 2.5, 34, "F");

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(40);
        doc.setTextColor(225, 225, 225);
        doc.text(chapter.label, margin + 8, 63);

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(22);
        doc.setTextColor(30, 30, 30);
        doc.text(titleLines, margin + 22, 74);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(...chapter.color);
        doc.text("Main Chapter", margin + 22, 74 + titleLines.length * 10 + 6);
      } else {
        doc.setFillColor(...chapter.color);
        doc.rect(0, 0, 8, pageHeight, "F");

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(48);
        doc.setTextColor(230, 230, 230);
        doc.text(chapter.label, margin + 10, 60);

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(22);
        doc.setTextColor(30, 30, 30);
        doc.text(titleLines, margin + 10, 90);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Main Chapter", margin + 10, 90 + titleLines.length * 10 + 5);
      }

      drawPageBranding();
      drawDividerMetadata();

      doc.setFont(primaryFont, "normal");
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `${state.info.documentNumber} | Rev. ${state.info.revision} | ${state.info.date}`,
        margin,
        pageHeight - 15
      );

      continue;
    }

    for (let j = 0; j < chapter.sections.length; j++) {
      const { section, label, mainChapterName, chapterColor } = chapter.sections[j];
      doc.addPage();
      const sectionPageNumber = doc.getNumberOfPages();
      if (!chapterPageMap.has(chapter.category)) {
        chapterPageMap.set(chapter.category, sectionPageNumber);
      }
      chapterSectionPageMap.get(chapter.category)?.push({
        label,
        title: section.title,
        pageNumber: sectionPageNumber,
      });
      const mainChapterLines = doc.splitTextToSize(mainChapterName, contentWidth - 20);
      const titleLines = doc.splitTextToSize(section.title, contentWidth - 20);
      const descLines = doc.splitTextToSize(section.description, contentWidth - 20);

      if (documentStyle.dividerStyle === "panel") {
        doc.setFillColor(...chapterColor);
        doc.rect(0, 0, pageWidth, 96, "F");

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(42);
        doc.setTextColor(255, 255, 255);
        doc.text(label, margin, 44);

        doc.setFont("courier", "bold");
        doc.setFontSize(13);
        doc.text(section.code, margin, 60);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(13);
        doc.text(mainChapterLines, margin, 72);

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(22);
        doc.text(titleLines, margin, 88);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(descLines, margin, 120);
      } else if (documentStyle.dividerStyle === "minimal") {
        doc.setFillColor(...chapterColor);
        doc.rect(margin, 28, contentWidth, 1.5, "F");
        doc.rect(margin, 44, 2.5, 54, "F");

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(40);
        doc.setTextColor(225, 225, 225);
        doc.text(label, margin + 8, 60);

        doc.setFont("courier", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...chapterColor);
        doc.text(section.code, margin + 22, 63);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(14);
        doc.setTextColor(120, 120, 120);
        doc.text(mainChapterLines, margin + 22, 77);

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(22);
        doc.setTextColor(30, 30, 30);
        const subchapterTitleY = 77 + mainChapterLines.length * 7 + 5;
        doc.text(titleLines, margin + 22, subchapterTitleY);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(descLines, margin + 22, subchapterTitleY + titleLines.length * 10 + 8);
      } else {
        doc.setFillColor(...chapterColor);
        doc.rect(0, 0, 8, pageHeight, "F");

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(48);
        doc.setTextColor(230, 230, 230);
        doc.text(label, margin + 10, 60);

        doc.setFont("courier", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...chapterColor);
        doc.text(section.code, margin + 10, 75);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(16);
        doc.setTextColor(120, 120, 120);
        doc.text(mainChapterLines, margin + 10, 88);

        doc.setFont(primaryFont, "bold");
        doc.setFontSize(22);
        doc.setTextColor(30, 30, 30);
        const subchapterTitleY = 88 + mainChapterLines.length * 7 + 4;
        doc.text(titleLines, margin + 10, subchapterTitleY);

        doc.setFont(primaryFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(descLines, margin + 10, subchapterTitleY + titleLines.length * 10 + 8);
      }

      drawPageBranding();
      drawDividerMetadata();

      doc.setFont(primaryFont, "normal");
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `${state.info.documentNumber} | Rev. ${state.info.revision} | ${state.info.date}`,
        margin,
        pageHeight - 15
      );
    }
  }

  // ===== LAST PAGE — Powered by BizzBit =====
  doc.addPage();
  finalPageNumber = doc.getNumberOfPages();
  doc.setFillColor(15, 23, 42); // navy
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFont(primaryFont, "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Powered by", pageWidth / 2, pageHeight / 2 - 15, {
    align: "center",
  });

  doc.setFontSize(28);
  doc.setTextColor(...primaryRgb);
  doc.text("BizzBit", pageWidth / 2, pageHeight / 2 + 5, {
    align: "center",
  });

  doc.setFont(primaryFont, "normal");
  doc.setFontSize(10);
  doc.setTextColor(150, 160, 180);
  doc.text(
    "Smart software for reliable project delivery",
    pageWidth / 2,
    pageHeight / 2 + 18,
    { align: "center" }
  );

  doc.setFontSize(9);
  doc.setTextColor(100, 110, 130);
  doc.text("www.bizzbit.com", pageWidth / 2, pageHeight / 2 + 30, {
    align: "center",
  });

  drawPageBranding({ dark: true, includeLogo: false });

  // Add hierarchical PDF bookmarks.
  doc.outline.add(null, "Cover", { pageNumber: coverPageNumber });

  if (tocPages.length > 0) {
    const tocRoot = doc.outline.add(null, "Table of Contents", {
      pageNumber: tocPages[0],
    });
    tocPages.forEach((pageNumber, index) => {
      if (tocPages.length > 1) {
        doc.outline.add(tocRoot, `Page ${index + 1}`, { pageNumber });
      }
    });
  }

  const firstChapterPage = chapterMetas
    .map((chapter) => chapterPageMap.get(chapter.category))
    .find((pageNumber): pageNumber is number => typeof pageNumber === "number");

  const chaptersRoot = doc.outline.add(null, "Chapters", {
    pageNumber: firstChapterPage ?? (tocPages[0] ?? coverPageNumber),
  });

  chapterMetas.forEach((chapter) => {
    const chapterPage = chapterPageMap.get(chapter.category);
    if (!chapterPage) return;

    const chapterNode = doc.outline.add(
      chaptersRoot,
      `${chapter.label} - ${chapter.title}`,
      { pageNumber: chapterPage }
    );

    const subchapterPages = chapterSectionPageMap.get(chapter.category) || [];
    subchapterPages.forEach((subchapter) => {
      doc.outline.add(
        chapterNode,
        `${subchapter.label} - ${subchapter.title}`,
        { pageNumber: subchapter.pageNumber }
      );
    });
  });

  doc.outline.add(null, "Powered by BizzBit", { pageNumber: finalPageNumber });

  // Build ZIP export mapping based on bookmark labels.
  const exportItems: ExportItem[] = [{ title: "0 - Cover", pageNumbers: [coverPageNumber] }];

  if (tocPages.length > 0) {
    exportItems.push({ title: "0 - Table of Contents", pageNumbers: [...tocPages] });
  }

  chapterMetas.forEach((chapter) => {
    const chapterPage = chapterPageMap.get(chapter.category);
    if (!chapterPage) return;

    const subchapterPages = chapterSectionPageMap.get(chapter.category) || [];
    if (subchapterPages.length === 0) {
      // Chapter-only divider page should be exported only when no subchapters exist.
      exportItems.push({
        title: `${chapter.label} - ${chapter.title}`,
        pageNumbers: [chapterPage],
      });
    }

    subchapterPages.forEach((subchapter) => {
      exportItems.push({
        title: `${subchapter.label} - ${subchapter.title}`,
        pageNumbers: [subchapter.pageNumber],
      });
    });
  });

  exportItems.push({ title: "Powered by BizzBit", pageNumbers: [finalPageNumber] });

  // Open PDF with bookmark panel for faster navigation.
  doc.setDisplayMode("fullwidth", "continuous", "UseOutlines");

  return { doc, exportItems };
}

export async function generatePdf(
  state: MdbState,
  options?: { filename?: string }
): Promise<void> {
  const { doc } = buildPdfDocument(state);

  // Save
  const filename =
    options?.filename ||
    (state.info.documentNumber
      ? `${state.info.documentNumber}_MDB.pdf`
      : "MDB_Structure.pdf");
  doc.save(filename);
}

export async function generatePdfBlob(state: MdbState): Promise<Blob> {
  const { doc } = buildPdfDocument(state);
  const bytes = doc.output("arraybuffer") as ArrayBuffer;
  return new Blob([bytes], { type: "application/pdf" });
}

export async function generatePdfZip(state: MdbState): Promise<void> {
  const entries = await generatePdfZipEntries(state);
  const zip = new JSZip();

  for (const entry of entries) {
    zip.file(entry.filename, entry.bytes);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const filename = state.info.documentNumber
    ? `${sanitizeFileName(state.info.documentNumber)}_MDB_Sheets.zip`
    : "MDB_Sheets.zip";
  downloadBlob(zipBlob, filename);
}

export async function generatePdfZipEntries(state: MdbState): Promise<PdfZipEntry[]> {
  const { doc, exportItems } = buildPdfDocument(state);
  const sourceBytes = doc.output("arraybuffer") as ArrayBuffer;
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const fileNameSeen = new Map<string, number>();
  const entries: PdfZipEntry[] = [];

  for (const item of exportItems) {
    const partPdf = await PDFDocument.create();
    const pageIndexes = item.pageNumbers.map((page) => page - 1).filter((index) => index >= 0);
    const copiedPages = await partPdf.copyPages(sourcePdf, pageIndexes);
    copiedPages.forEach((page) => partPdf.addPage(page));

    const safeBase = makeUniqueFileName(sanitizeFileName(item.title), fileNameSeen);
    const bytes = await partPdf.save();
    entries.push({ filename: `${safeBase}.pdf`, bytes });
  }

  return entries;
}
