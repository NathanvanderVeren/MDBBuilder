/**
 * PDF Generator for MDB Builder
 * Generates a professional PDF with cover page, TOC, section dividers, and bookmarks
 * Uses jsPDF for client-side PDF generation
 */
import { jsPDF } from "jspdf";
import type { MdbSection, ProjectInfo, SectionCategory } from "./mdb-data";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "./mdb-data";

interface MdbState {
  info: ProjectInfo;
  sections: MdbSection[];
  chapterOrder: SectionCategory[];
  chapterMeta: Record<SectionCategory, { title: string; color: string }>;
  logoUrl: string | null;
  primaryColor: string;
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

export async function generatePdf(state: MdbState): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const primaryRgb = hexToRgb(state.primaryColor);
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
  // Top color bar
  doc.setFillColor(...primaryRgb);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo
  if (state.logoUrl) {
    try {
      doc.addImage(state.logoUrl, "PNG", margin, 8, 40, 24, undefined, "FAST");
    } catch {
      // Logo failed to load, skip
    }
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(30, 30, 30);
  doc.text("Manufacturing", margin, 75);
  doc.text("Data Book", margin, 90);

  // Project info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  let y = 110;
  const infoLines = [
    ["Project:", state.info.projectName || "—"],
    ["Client:", state.info.clientName || "—"],
    ["Document No.:", state.info.documentNumber],
    ["Revision:", state.info.revision],
    ["Date:", state.info.date],
  ];

  for (const [label, value] of infoLines) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(value, margin + 35, y);
    y += 8;
  }

  // Divider line
  doc.setDrawColor(...primaryRgb);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 5, pageWidth - margin, y + 5);

  // ===== TABLE OF CONTENTS PAGES =====
  doc.addPage();

  const drawTocHeader = (isFirstPage: boolean): number => {
    let tocY = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...primaryRgb);
    doc.text("INDEX / TABLE OF CONTENTS", margin, tocY);
    tocY += 7;

    if (isFirstPage) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, tocY, pageWidth - margin, tocY);
      tocY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(
        `Project: ${state.info.projectName || "-"}   |   Client: ${state.info.clientName || "-"}`,
        margin,
        tocY
      );
      tocY += 4.5;
      doc.text(
        `Doc No.: ${state.info.documentNumber}   |   Rev: ${state.info.revision}   |   Date: ${state.info.date}`,
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
      y = drawTocHeader(false);
    }

    const isSubchapter = row.kind === "subchapter";
    const labelX = isSubchapter ? margin + 4 : margin;
    const codeX = isSubchapter ? margin + 16 : margin + 10;
    const titleX = isSubchapter ? margin + 30 : margin + 22;

    doc.setFont("helvetica", row.kind === "chapter" ? "bold" : "normal");
    doc.setTextColor(row.kind === "chapter" ? 55 : 100, row.kind === "chapter" ? 55 : 100, row.kind === "chapter" ? 55 : 100);
    doc.text(row.label, labelX, y);

    if (row.code) {
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(row.code, codeX, y);
    }

    doc.setFont("helvetica", row.kind === "chapter" ? "bold" : "normal");
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
      doc.setFillColor(...chapter.color);
      doc.rect(0, 0, 8, pageHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(48);
      doc.setTextColor(230, 230, 230);
      doc.text(chapter.label, margin + 10, 60);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(chapter.title, contentWidth - 20);
      doc.text(titleLines, margin + 10, 90);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Main Chapter", margin + 10, 90 + titleLines.length * 10 + 5);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(
        "Insert chapter-level reports/documents here",
        margin + 10,
        pageHeight - 40
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `${state.info.documentNumber} | Rev. ${state.info.revision} | ${state.info.date}`,
        margin,
        pageHeight - 15
      );
      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        pageWidth - margin - 15,
        pageHeight - 15
      );

      continue;
    }

    for (let j = 0; j < chapter.sections.length; j++) {
      const { section, label, mainChapterName, chapterColor } = chapter.sections[j];
      doc.addPage();

      const outlineItem = {
        title: `${label} — ${section.title}`,
        options: { pageNumber: doc.getNumberOfPages() },
      };

      doc.setFillColor(...chapterColor);
      doc.rect(0, 0, 8, pageHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(48);
      doc.setTextColor(230, 230, 230);
      doc.text(label, margin + 10, 60);

      doc.setFont("courier", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...chapterColor);
      doc.text(section.code, margin + 10, 75);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(section.title, contentWidth - 20);
      doc.text(titleLines, margin + 10, 90);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Main Chapter: ${mainChapterName}`,
        margin + 10,
        90 + titleLines.length * 10 + 5
      );

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const descLines = doc.splitTextToSize(section.description, contentWidth - 20);
      doc.text(
        descLines,
        margin + 10,
        90 + titleLines.length * 10 + 15
      );

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(
        "Insert documents for this section here",
        margin + 10,
        pageHeight - 40
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `${state.info.documentNumber} | Rev. ${state.info.revision} | ${state.info.date}`,
        margin,
        pageHeight - 15
      );
      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        pageWidth - margin - 15,
        pageHeight - 15
      );
    }
  }

  // ===== LAST PAGE — Powered by BizzBit =====
  doc.addPage();
  doc.setFillColor(15, 23, 42); // navy
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFont("helvetica", "bold");
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

  doc.setFont("helvetica", "normal");
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

  // Save
  const filename = state.info.documentNumber
    ? `${state.info.documentNumber}_MDB.pdf`
    : "MDB_Structure.pdf";
  doc.save(filename);
}
