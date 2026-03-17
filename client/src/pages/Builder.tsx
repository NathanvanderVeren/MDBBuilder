/**
 * Builder Page — Split-panel workspace
 * Left: Section library + templates
 * Center: Drag-and-drop builder
 * Right: Live preview + completeness checker
 * Design: Industrial Blueprint
 */
import { useAuth } from "@/contexts/AuthContext";
import { useMdb } from "@/contexts/MdbContext";
import {
  ALL_SECTIONS,
  SECTOR_TEMPLATES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type MdbSection,
  type SectionCategory,
} from "@/lib/mdb-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus,
  X,
  Trash2,
  GripVertical,
  Info,
  Pencil,
  FileDown,
  Archive,
  LogOut,
  ChevronLeft,
  Search,
  Lightbulb,
  AlertTriangle,
  LayoutTemplate,
  Save,
  Settings,
  Lock,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { generatePdf, generatePdfBlob, generatePdfZip, generatePdfZipEntries } from "@/lib/pdf-generator";
import JSZip from "jszip";
import {
  generateAutoUnitNumbers,
  getProduct,
  saveMdbData,
  updateProduct,
  type ProductWithMdb,
} from "@/lib/products";
import { updateProject } from "@/lib/projects";
import {
  ProductFormFields,
  type ProductForm,
  emptyProductForm,
  alignCustomUnitNumbers,
  countEmptyCustomUnitNumbers,
} from "@/components/ProductFormFields";
import { getBrandingSettings, saveBrandingSettings, type BrandingSettings } from "@/lib/branding";
import {
  COVER_STYLE_OPTIONS,
  DEFAULT_PROJECT_DOCUMENT_STYLE,
  DIVIDER_STYLE_OPTIONS,
  FONT_FAMILY_OPTIONS,
  getPreviewFontFamily,
  normalizeProjectDocumentStyle,
  type ProjectDocumentStyle,
} from "@/lib/document-styles";
import {
  createLibraryCategory,
  createLibrarySection,
  getLibrary,
  updateLibraryCategory,
  updateLibrarySection,
  type LibraryCategory,
  type LibrarySection,
} from "@/lib/library";
import ThemeToggle from "@/components/ThemeToggle";
import BizzBitLogo from "@/components/BizzBitLogo";
import BrandColorPalette from "@/components/BrandColorPalette";
import { motion } from "framer-motion";

type SectionDraft = {
  title: string;
  code: string;
  description: string;
};

const COLOR_PRESETS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#F97316",
];

function StyleOptionCard({
  selected,
  label,
  description,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/70 bg-muted/10 hover:border-primary/40 hover:bg-muted/20"
      }`}
    >
      <div className="mb-3 overflow-hidden rounded-lg border border-border/50 bg-background">{children}</div>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs leading-relaxed text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

function CoverStylePreview({
  style,
  color,
  fontFamily,
  companyName,
}: {
  style: ProjectDocumentStyle["coverStyle"];
  color: string;
  fontFamily: ProjectDocumentStyle["fontFamily"];
  companyName: string;
}) {
  const previewFont = getPreviewFontFamily(fontFamily);

  if (style === "split") {
    return (
      <div className="grid h-28 grid-cols-[30%_1fr]" style={{ fontFamily: previewFont }}>
        <div className="p-3 text-white" style={{ backgroundColor: color }}>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/70">Cover</div>
          <div className="mt-7 text-2xl font-bold">MDB</div>
        </div>
        <div className="flex flex-col justify-between p-3" style={{ backgroundColor: '#ffffff' }}>
          <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>Manufacturing Data Book</div>
          <div className="space-y-1">
            <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>Project Atlas Compressor</div>
            <div className="text-xs" style={{ color: '#64748b' }}>Unit package documentation preview</div>
          </div>
          <div className="text-[10px]" style={{ color: '#64748b' }}>{companyName || "Your Company"}</div>
        </div>
      </div>
    );
  }

  if (style === "angled") {
    return (
      <div className="relative h-28 overflow-hidden p-3" style={{ fontFamily: previewFont, backgroundColor: '#ffffff' }}>
        <div
          className="absolute -right-6 -top-6 h-24 w-32 rotate-[-18deg] rounded-sm opacity-90"
          style={{ backgroundColor: color }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: '#64748b' }}>Project Style</div>
          <div>
            <div className="text-lg font-bold" style={{ color: '#0f172a' }}>Manufacturing Data Book</div>
            <div className="mt-1 text-xs" style={{ color: '#64748b' }}>Technical dossier with angled identity band</div>
          </div>
          <div className="text-[10px]" style={{ color: '#64748b' }}>{companyName || "Your Company"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-28" style={{ fontFamily: previewFont, backgroundColor: '#ffffff' }}>
      <div className="h-7" style={{ backgroundColor: color }} />
      <div className="space-y-2 p-3">
        <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#64748b' }}>Classic Cover</div>
        <div className="text-lg font-bold" style={{ color: '#0f172a' }}>Manufacturing Data Book</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: '#64748b' }}>
          <div className="rounded px-2 py-1" style={{ backgroundColor: '#f1f5f9' }}>Project data</div>
          <div className="rounded px-2 py-1" style={{ backgroundColor: '#f1f5f9' }}>Product data</div>
        </div>
      </div>
    </div>
  );
}

function DividerStylePreview({
  style,
  color,
  fontFamily,
}: {
  style: ProjectDocumentStyle["dividerStyle"];
  color: string;
  fontFamily: ProjectDocumentStyle["fontFamily"];
}) {
  const previewFont = getPreviewFontFamily(fontFamily);

  if (style === "panel") {
    return (
      <div className="h-24" style={{ fontFamily: previewFont }}>
        <div className="h-14 px-3 pt-2 text-white" style={{ backgroundColor: color }}>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">Chapter</div>
          <div className="mt-1 text-3xl font-bold">03</div>
        </div>
        <div className="flex h-10 items-center px-3" style={{ backgroundColor: '#ffffff' }}>
          <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>Welder Qualifications</div>
        </div>
      </div>
    );
  }

  if (style === "minimal") {
    return (
      <div className="relative h-24 p-3" style={{ fontFamily: previewFont, backgroundColor: '#ffffff' }}>
        <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: color }} />
        <div className="flex h-full flex-col justify-center gap-1 pl-3">
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#64748b' }}>03.2</div>
          <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>Welder Qualifications</div>
          <div className="text-[10px]" style={{ color: '#64748b' }}>Minimal metadata treatment</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden" style={{ fontFamily: previewFont, backgroundColor: '#ffffff' }}>
      <div className="absolute left-0 top-0 h-full w-3" style={{ backgroundColor: color }} />
      <div className="flex h-full flex-col justify-center gap-1 px-4 pl-7">
        <div className="text-3xl font-bold" style={{ color: '#94a3b8' }}>03</div>
        <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>Welding Procedures</div>
      </div>
    </div>
  );
}

function sanitizeExportFileName(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/g, "");
  return sanitized || "export";
}

function downloadFileBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Builder() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    state,
    setInfo,
    setSections,
    setChapterOrder,
    addChapter,
    removeChapter,
    updateChapterTitle,
    updateChapterColor,
    addCustomSubchapter,
    updateSectionTitle,
    updateSectionCode,
    updateSectionDescription,
    addSection,
    removeSection,
    setLogoUrl,
    setPrimaryColor,
    loadState,
    resetProject,
  } = useMdb();
  const { productId } = useParams<{ productId: string }>();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SectionCategory | "all">("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateWarningOpen, setTemplateWarningOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductWithMdb | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryCategories, setLibraryCategories] = useState<LibraryCategory[]>([]);
  const [librarySections, setLibrarySections] = useState<LibrarySection[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LibraryCategory | null>(null);
  const [editingSection, setEditingSection] = useState<LibrarySection | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#6B7280");
  const [categoryBaseline, setCategoryBaseline] = useState<{ name: string; color: string } | null>(null);
  const [sectionCategoryId, setSectionCategoryId] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionBaseline, setSectionBaseline] = useState<{
    categoryId: string;
    title: string;
    code: string;
    description: string;
  } | null>(null);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [libraryUnsavedDialogOpen, setLibraryUnsavedDialogOpen] = useState(false);
  const [pendingLibraryModal, setPendingLibraryModal] = useState<"category" | "section" | null>(null);
  const [draggingChapter, setDraggingChapter] = useState<SectionCategory | null>(null);
  const [isChapterPointerDragging, setIsChapterPointerDragging] = useState(false);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragChapterPreviewTarget, setDragChapterPreviewTarget] = useState<string | null>(null);
  const [dragPreviewTarget, setDragPreviewTarget] = useState<string | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [savingBeforeExit, setSavingBeforeExit] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedUnitNumbers, setSelectedUnitNumbers] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"pdf" | "zip">("pdf");
  const [productEditOpen, setProductEditOpen] = useState(false);
  const [productEditForm, setProductEditForm] = useState<ProductForm>(emptyProductForm());
  const [productEditBaseline, setProductEditBaseline] = useState<ProductForm | null>(null);
  const [savingProductEdit, setSavingProductEdit] = useState(false);
  const [productEditUnsavedDialogOpen, setProductEditUnsavedDialogOpen] = useState(false);
  const [productEditValidationOpen, setProductEditValidationOpen] = useState(false);
  const [productEditValidationMissing, setProductEditValidationMissing] = useState(0);
  const [brandingSettingsOpen, setBrandingSettingsOpen] = useState(false);
  const [settingsUnsavedDialogOpen, setSettingsUnsavedDialogOpen] = useState(false);
  const [savingBrandingSettings, setSavingBrandingSettings] = useState(false);
  const [projectStyle, setProjectStyle] = useState<ProjectDocumentStyle>(DEFAULT_PROJECT_DOCUMENT_STYLE);
  const [sectionEditDialogOpen, setSectionEditDialogOpen] = useState(false);
  const [sectionEditMode, setSectionEditMode] = useState<"create" | "edit">("edit");
  const [sectionEditTargetId, setSectionEditTargetId] = useState<string | null>(null);
  const [sectionEditTargetCategory, setSectionEditTargetCategory] = useState<SectionCategory | null>(null);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>({
    title: "",
    code: "",
    description: "",
  });
  const [branding, setBranding] = useState<BrandingSettings>({
    companyName: user?.company || null,
    logoUrl: null,
    primaryColor: "#3B82F6",
  });
  const [settingsBranding, setSettingsBranding] = useState<BrandingSettings>({
    companyName: user?.company || null,
    logoUrl: null,
    primaryColor: "#3B82F6",
  });
  const [builderBrandingLogoDragActive, setBuilderBrandingLogoDragActive] = useState(false);
  const [projectStyleDraft, setProjectStyleDraft] = useState<ProjectDocumentStyle>(
    DEFAULT_PROJECT_DOCUMENT_STYLE
  );
  const baselineStateRef = useRef<string | null>(null);
  const restoredDraftRef = useRef(false);
  const pendingExitActionRef = useRef<null | (() => void | Promise<void>)>(null);

  const selectedIds = new Set(state.sections.map((s) => s.id));
  const chapterCount = state.sections.filter((section) => section.id !== "mdb-index").length;
  const indexSection = state.sections.find((section) => section.id === "mdb-index");

  const getChapterTitle = useCallback(
    (chapterId: SectionCategory) => state.chapterMeta[chapterId]?.title || CATEGORY_LABELS[chapterId] || chapterId,
    [state.chapterMeta]
  );

  const getChapterColor = useCallback(
    (chapterId: SectionCategory) => state.chapterMeta[chapterId]?.color || CATEGORY_COLORS[chapterId] || "#6B7280",
    [state.chapterMeta]
  );

  const refreshLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const data = await getLibrary();
      setLibraryCategories(data.categories);
      setLibrarySections(data.sections.filter((section) => section.key !== "mdb-index"));
    } catch (error) {
      toast.error("Failed to load section library", { description: String(error) });
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void refreshLibrary();
  }, [refreshLibrary, authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    async function loadBranding() {
      const { branding: loadedBranding, error } = await getBrandingSettings();
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load branding settings", { description: error });
        return;
      }

      setBranding({
        companyName: loadedBranding.companyName ?? user?.company ?? null,
        logoUrl: loadedBranding.logoUrl,
        primaryColor: loadedBranding.primaryColor,
        marketingConsent: loadedBranding.marketingConsent,
      });
      setSettingsBranding({
        companyName: loadedBranding.companyName ?? user?.company ?? null,
        logoUrl: loadedBranding.logoUrl,
        primaryColor: loadedBranding.primaryColor,
        marketingConsent: loadedBranding.marketingConsent,
      });
    }

    void loadBranding();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    setLogoUrl(branding.logoUrl);
    setPrimaryColor(branding.primaryColor);
  }, [branding.logoUrl, branding.primaryColor, setLogoUrl, setPrimaryColor]);

  const librarySectionByKey = useMemo(
    () => new Map(librarySections.map((section) => [section.key, section])),
    [librarySections]
  );

  const ensureChapterForLibraryCategory = useCallback(
    (categoryKey: string, categoryName: string, color: string) => {
      if (!state.chapterOrder.includes(categoryKey)) {
        setChapterOrder([...state.chapterOrder, categoryKey]);
      }
      if (!state.chapterMeta[categoryKey]) {
        updateChapterTitle(categoryKey, categoryName);
        updateChapterColor(categoryKey, color);
      }
    },
    [state.chapterOrder, state.chapterMeta, setChapterOrder, updateChapterTitle, updateChapterColor]
  );

  const sectionsByCategory = useMemo(() => {
    const grouped = Object.fromEntries(
      state.chapterOrder.map((category) => [category, [] as MdbSection[]])
    ) as Record<SectionCategory, MdbSection[]>;

    state.sections.forEach((section) => {
      if (section.id === "mdb-index") return;
      if (!grouped[section.category]) grouped[section.category] = [];
      grouped[section.category].push(section);
    });

    return grouped;
  }, [state.sections, state.chapterOrder]);

  const chapterNumbers = useMemo(() => {
    const map = new Map<SectionCategory, number>();
    let number = 1;
    state.chapterOrder.forEach((category) => {
      map.set(category, number);
      number += 1;
    });
    return map;
  }, [state.chapterOrder]);

  const moveChapter = useCallback(
    (fromCategory: SectionCategory, toIndex: number) => {
      const currentIndex = state.chapterOrder.indexOf(fromCategory);
      if (currentIndex < 0 || currentIndex === toIndex) return;

      const newOrder = [...state.chapterOrder];
      const [moved] = newOrder.splice(currentIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      setChapterOrder(newOrder);
    },
    [state.chapterOrder, setChapterOrder]
  );

  const moveSection = useCallback(
    (sectionId: string, toCategory: SectionCategory, toIndex: number) => {
      const movingSection = state.sections.find((section) => section.id === sectionId);
      if (!movingSection || movingSection.id === "mdb-index") return;

      const currentSiblings = state.sections.filter(
        (section) => section.id !== "mdb-index" && section.category === movingSection.category
      );
      const currentIndexInCategory = currentSiblings.findIndex(
        (section) => section.id === sectionId
      );
      if (
        movingSection.category === toCategory &&
        currentIndexInCategory === toIndex
      ) {
        return;
      }

      const index = state.sections.find((section) => section.id === "mdb-index");
      const nonIndexSections = state.sections.filter((section) => section.id !== "mdb-index" && section.id !== sectionId);
      const grouped = Object.fromEntries(
        state.chapterOrder.map((category) => [category, [] as MdbSection[]])
      ) as Record<SectionCategory, MdbSection[]>;

      nonIndexSections.forEach((section) => {
        if (!grouped[section.category]) grouped[section.category] = [];
        grouped[section.category].push(section);
      });

      if (!grouped[toCategory]) grouped[toCategory] = [];
      const targetList = grouped[toCategory];
      const boundedIndex = Math.max(0, Math.min(toIndex, targetList.length));
      targetList.splice(boundedIndex, 0, { ...movingSection, category: toCategory });

      const reordered = state.chapterOrder.flatMap((category) => grouped[category]);
      setSections(index ? [index, ...reordered] : reordered);
    },
    [state.sections, state.chapterOrder, setSections]
  );

  const previewMoveSection = useCallback(
    (sectionId: string, toCategory: SectionCategory, toIndex: number) => {
      const targetKey = `${sectionId}:${toCategory}:${toIndex}`;
      if (dragPreviewTarget === targetKey) return;
      setDragPreviewTarget(targetKey);
      moveSection(sectionId, toCategory, toIndex);
    },
    [dragPreviewTarget, moveSection]
  );

  const previewMoveChapter = useCallback(
    (fromCategory: SectionCategory, toIndex: number) => {
      const targetKey = `${fromCategory}:${toIndex}`;
      if (dragChapterPreviewTarget === targetKey) return;
      setDragChapterPreviewTarget(targetKey);
      moveChapter(fromCategory, toIndex);
    },
    [dragChapterPreviewTarget, moveChapter]
  );

  useEffect(() => {
    if (!isChapterPointerDragging) return;

    const handleMouseUp = () => {
      setIsChapterPointerDragging(false);
      setDraggingChapter(null);
      setDragChapterPreviewTarget(null);
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isChapterPointerDragging]);

  useEffect(() => {
    if (activeCategory === "all") return;
    if (!libraryCategories.some((category) => category.key === activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, libraryCategories]);

  const filteredSections = useMemo(() => {
    return librarySections.filter((s) => {
      if (s.key === "mdb-index") return false;
      if (selectedIds.has(s.key)) return false;
      if (activeCategory !== "all" && s.categoryKey !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [librarySections, searchQuery, activeCategory, selectedIds]);

  // Completeness score
  const completenessScore = useMemo(() => {
    if (state.sections.length === 0) return 0;
    const hasItp = state.sections.some((s) => s.id === "itp");
    const hasMtc = state.sections.some((s) => s.id === "mtc");
    const hasWelding = state.sections.some(
      (s) => s.category === "welding"
    );
    const hasNdt = state.sections.some((s) => s.category === "ndt");
    const hasTesting = state.sections.some(
      (s) => s.category === "testing"
    );
    const hasDrawings = state.sections.some(
      (s) => s.category === "drawings"
    );
    const hasCerts = state.sections.some(
      (s) => s.category === "certificates"
    );
    const hasLogo = !!branding.logoUrl;
    const hasCompanyName = !!branding.companyName?.trim();
    const hasProjectName = !!state.info.projectName;

    const checks = [
      hasItp,
      hasMtc,
      hasWelding,
      hasNdt,
      hasTesting,
      hasDrawings,
      hasCerts,
      hasLogo,
      hasCompanyName,
      hasProjectName,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [state, branding.logoUrl, branding.companyName]);

  // Suggestions
  const suggestions = useMemo(() => {
    const tips: string[] = [];
    if (!state.sections.some((s) => s.id === "itp"))
      tips.push("Add an Inspection & Test Plan (ITP) — required for most projects");
    if (
      state.sections.some((s) => s.id === "wps") &&
      !state.sections.some((s) => s.id === "pqr")
    )
      tips.push("You have WPS but no PQR — add Procedure Qualification Records");
    if (
      state.sections.some((s) => s.id === "wps") &&
      !state.sections.some((s) => s.id === "wpq")
    )
      tips.push("You have WPS but no WPQ — add Welder Performance Qualifications");
    if (!state.info.projectName) tips.push("Fill in your project name for the cover page");
    if (!branding.companyName?.trim()) tips.push("Set your company name in Settings for branded output");
    if (!branding.logoUrl) tips.push("Upload your company logo in Settings for branded output");
    return tips;
  }, [state, branding.companyName, branding.logoUrl]);

  const unitNumbers = useMemo(() => {
    if (!product?.unitsEnabled) return [] as string[];

    const count = Math.max(1, product.unitCount || 1);
    if (product.unitNumberingMode === "custom") {
      return (product.customUnitNumbers ?? [])
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .slice(0, count);
    }

      return generateAutoUnitNumbers(count, product.unitNumberingMode, product.unitNumberPrefix);
  }, [product]);

  const buildExportState = useCallback(
    (unitNumber?: string) => {
      const baseDocumentNumber = product?.mdbDocumentNumber || state.info.documentNumber || "MDB";
      return {
        ...state,
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        info: {
          ...state.info,
          documentNumber: unitNumber ? `${baseDocumentNumber} - ${unitNumber}` : baseDocumentNumber,
        },
        brandingData: {
          companyName: branding.companyName || undefined,
        },
        documentStyle: projectStyle,
        projectData: {
          projectNumber: product?.projectNumber,
          projectName: product?.projectName || state.info.projectName,
          customerName: product?.projectCustomerName || state.info.clientName,
          customerProjectNumber: product?.projectCustomerProjectNumber || undefined,
        },
        productData: {
          productName: product?.productName,
          tagNumber: product?.tagNumber || undefined,
          mdbDocumentNumber: baseDocumentNumber,
        },
        unitNumber,
      };
    },
    [branding.companyName, branding.logoUrl, branding.primaryColor, product, projectStyle, state]
  );

  const currentStateSnapshot = useMemo(() => JSON.stringify(state), [state]);
  const draftStorageKey = useMemo(
    () => (productId ? `mdb-builder-draft:${productId}` : null),
    [productId]
  );
  const hasUnsavedChanges = useMemo(() => {
    if (authLoading || loadingProduct) return false;
    if (baselineStateRef.current === null) return false;
    if (restoredDraftRef.current) return true;
    return baselineStateRef.current !== currentStateSnapshot;
  }, [authLoading, loadingProduct, currentStateSnapshot]);

  const executePendingExit = useCallback(async () => {
    const action = pendingExitActionRef.current;
    pendingExitActionRef.current = null;
    setUnsavedDialogOpen(false);
    if (!action) return;
    await action();
  }, []);

  const requestExit = useCallback(
    (action: () => void | Promise<void>) => {
      if (!hasUnsavedChanges) {
        void Promise.resolve(action());
        return;
      }
      pendingExitActionRef.current = action;
      setUnsavedDialogOpen(true);
    },
    [hasUnsavedChanges]
  );

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = SECTOR_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const nextChapterOrder = [...state.chapterOrder];
      const chapterSet = new Set(nextChapterOrder);

      const sections = template.sectionIds
        .map((key) => {
          const librarySection = librarySectionByKey.get(key);
          if (librarySection) {
            if (!chapterSet.has(librarySection.categoryKey)) {
              chapterSet.add(librarySection.categoryKey);
              nextChapterOrder.push(librarySection.categoryKey);
              if (!state.chapterMeta[librarySection.categoryKey]) {
                updateChapterTitle(librarySection.categoryKey, librarySection.categoryName);
                updateChapterColor(librarySection.categoryKey, librarySection.categoryColor);
              }
            }

            return {
              id: librarySection.key,
              title: librarySection.title,
              code: librarySection.code,
              category: librarySection.categoryKey,
              description: librarySection.description,
              suggestedSections: librarySection.suggestedSections || undefined,
            } as MdbSection;
          }

          const fallbackSection = ALL_SECTIONS.find((s) => s.id === key);
          if (fallbackSection && !chapterSet.has(fallbackSection.category)) {
            chapterSet.add(fallbackSection.category);
            nextChapterOrder.push(fallbackSection.category);
          }
          return fallbackSection;
        })
        .filter(Boolean) as MdbSection[];

      setChapterOrder(nextChapterOrder);
      setSections(sections);
      setTemplateDialogOpen(false);
      toast.success(`Template "${template.name}" applied`, {
        description: `${sections.filter((section) => section.id !== "mdb-index").length} chapters loaded`,
      });
    },
    [
      state.chapterOrder,
      state.chapterMeta,
      setSections,
      setChapterOrder,
      librarySectionByKey,
      updateChapterTitle,
      updateChapterColor,
    ]
  );

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      const hasExistingChapters = state.chapterOrder.length > 0;
      const hasExistingSections = state.sections.some((section) => section.id !== "mdb-index");

      if (hasExistingChapters || hasExistingSections) {
        setPendingTemplateId(templateId);
        setTemplateWarningOpen(true);
        return;
      }

      handleApplyTemplate(templateId);
    },
    [state.chapterOrder.length, state.sections, handleApplyTemplate]
  );

  const handleConfirmTemplateApply = useCallback(() => {
    if (!pendingTemplateId) return;
    handleApplyTemplate(pendingTemplateId);
    setTemplateWarningOpen(false);
    setPendingTemplateId(null);
  }, [pendingTemplateId, handleApplyTemplate]);

  const handleCancelTemplateApply = useCallback(() => {
    setTemplateWarningOpen(false);
    setPendingTemplateId(null);
  }, []);

  const openCreateCategoryDialog = useCallback(() => {
    const initialCategory = { name: "", color: "#6B7280" };
    setEditingCategory(null);
    setCategoryName(initialCategory.name);
    setCategoryColor(initialCategory.color);
    setCategoryBaseline(initialCategory);
    setCategoryDialogOpen(true);
  }, []);

  const openEditCategoryDialog = useCallback((category: LibraryCategory) => {
    const initialCategory = { name: category.name, color: category.color };
    setEditingCategory(category);
    setCategoryName(initialCategory.name);
    setCategoryColor(initialCategory.color);
    setCategoryBaseline(initialCategory);
    setCategoryDialogOpen(true);
  }, []);

  const isCategoryDirty = useMemo(() => {
    if (!categoryBaseline) return false;
    return categoryName !== categoryBaseline.name || categoryColor !== categoryBaseline.color;
  }, [categoryName, categoryColor, categoryBaseline]);

  const requestCloseCategoryDialog = useCallback(() => {
    if (savingLibrary) return;

    if (isCategoryDirty) {
      setPendingLibraryModal("category");
      setLibraryUnsavedDialogOpen(true);
      return;
    }

    setCategoryDialogOpen(false);
  }, [savingLibrary, isCategoryDirty]);

  const saveCategory = useCallback(async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSavingLibrary(true);
    try {
      if (editingCategory) {
        await updateLibraryCategory(editingCategory.id, {
          name: categoryName.trim(),
          color: categoryColor,
        });
        toast.success("Category updated");
      } else {
        await createLibraryCategory({
          name: categoryName.trim(),
          color: categoryColor,
        });
        toast.success("Category created");
      }
      setCategoryDialogOpen(false);
      await refreshLibrary();
    } catch (error) {
      toast.error("Failed to save category", { description: String(error) });
    } finally {
      setSavingLibrary(false);
    }
  }, [categoryName, categoryColor, editingCategory, refreshLibrary]);

  const openCreateSectionDialog = useCallback(() => {
    const initialSection = {
      categoryId: libraryCategories[0]?.id || "",
      title: "",
      code: "",
      description: "",
    };
    setEditingSection(null);
    setSectionTitle(initialSection.title);
    setSectionCode(initialSection.code);
    setSectionDescription(initialSection.description);
    setSectionCategoryId(initialSection.categoryId);
    setSectionBaseline(initialSection);
    setSectionDialogOpen(true);
  }, [libraryCategories]);

  const openEditSectionDialog = useCallback((section: LibrarySection) => {
    const initialSection = {
      categoryId: section.categoryId,
      title: section.title,
      code: section.code,
      description: section.description,
    };
    setEditingSection(section);
    setSectionTitle(initialSection.title);
    setSectionCode(initialSection.code);
    setSectionDescription(initialSection.description);
    setSectionCategoryId(initialSection.categoryId);
    setSectionBaseline(initialSection);
    setSectionDialogOpen(true);
  }, []);

  const isSectionDirty = useMemo(() => {
    if (!sectionBaseline) return false;
    return (
      sectionCategoryId !== sectionBaseline.categoryId ||
      sectionTitle !== sectionBaseline.title ||
      sectionCode !== sectionBaseline.code ||
      sectionDescription !== sectionBaseline.description
    );
  }, [sectionCategoryId, sectionTitle, sectionCode, sectionDescription, sectionBaseline]);

  const requestCloseSectionDialog = useCallback(() => {
    if (savingLibrary) return;

    if (isSectionDirty) {
      setPendingLibraryModal("section");
      setLibraryUnsavedDialogOpen(true);
      return;
    }

    setSectionDialogOpen(false);
  }, [savingLibrary, isSectionDirty]);

  const discardLibraryDialogChanges = useCallback(() => {
    if (pendingLibraryModal === "category") {
      if (categoryBaseline) {
        setCategoryName(categoryBaseline.name);
        setCategoryColor(categoryBaseline.color);
      }
      setCategoryDialogOpen(false);
    }

    if (pendingLibraryModal === "section") {
      if (sectionBaseline) {
        setSectionCategoryId(sectionBaseline.categoryId);
        setSectionTitle(sectionBaseline.title);
        setSectionCode(sectionBaseline.code);
        setSectionDescription(sectionBaseline.description);
      }
      setSectionDialogOpen(false);
    }

    setLibraryUnsavedDialogOpen(false);
    setPendingLibraryModal(null);
  }, [pendingLibraryModal, categoryBaseline, sectionBaseline]);

  const saveSection = useCallback(async () => {
    if (!sectionCategoryId || !sectionTitle.trim() || !sectionCode.trim() || !sectionDescription.trim()) {
      toast.error("Category, title, code, and description are required");
      return;
    }

    setSavingLibrary(true);
    try {
      if (editingSection) {
        await updateLibrarySection(editingSection.id, {
          categoryId: sectionCategoryId,
          title: sectionTitle.trim(),
          code: sectionCode.trim(),
          description: sectionDescription.trim(),
        });
        toast.success("Section updated");
      } else {
        await createLibrarySection({
          categoryId: sectionCategoryId,
          title: sectionTitle.trim(),
          code: sectionCode.trim(),
          description: sectionDescription.trim(),
        });
        toast.success("Section created");
      }
      setSectionDialogOpen(false);
      await refreshLibrary();
    } catch (error) {
      toast.error("Failed to save section", { description: String(error) });
    } finally {
      setSavingLibrary(false);
    }
  }, [
    sectionCategoryId,
    sectionTitle,
    sectionCode,
    sectionDescription,
    editingSection,
    refreshLibrary,
  ]);

  const openCreateSubchapterDialog = useCallback((category: SectionCategory) => {
    setSectionEditMode("create");
    setSectionEditTargetId(null);
    setSectionEditTargetCategory(category);
    setSectionDraft({
      title: "New Subchapter",
      code: "CUS",
      description: "Custom subchapter",
    });
    setSectionEditDialogOpen(true);
  }, []);

  const openEditSubchapterDialog = useCallback((section: MdbSection) => {
    setSectionEditMode("edit");
    setSectionEditTargetId(section.id);
    setSectionEditTargetCategory(section.category);
    setSectionDraft({
      title: section.title,
      code: section.code,
      description: section.description,
    });
    setSectionEditDialogOpen(true);
  }, []);

  const handleSaveSubchapterDialog = useCallback(() => {
    const title = sectionDraft.title.trim();
    const code = sectionDraft.code.trim();
    const description = sectionDraft.description.trim();

    if (!title || !code || !description) {
      toast.error("Title, code, and description are required");
      return;
    }

    if (sectionEditMode === "create") {
      if (!sectionEditTargetCategory) {
        toast.error("Missing target chapter");
        return;
      }

      addSection({
        id: `sub-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        title,
        code,
        category: sectionEditTargetCategory,
        description,
      });
      toast.success("Subchapter added");
    } else {
      if (!sectionEditTargetId) {
        toast.error("Missing target subchapter");
        return;
      }

      updateSectionTitle(sectionEditTargetId, title);
      updateSectionCode(sectionEditTargetId, code);
      updateSectionDescription(sectionEditTargetId, description);
      toast.success("Subchapter updated");
    }

    setSectionEditDialogOpen(false);
  }, [
    sectionDraft,
    sectionEditMode,
    sectionEditTargetCategory,
    sectionEditTargetId,
    addSection,
    updateSectionTitle,
    updateSectionCode,
    updateSectionDescription,
  ]);

  const openProductEditDialog = useCallback(() => {
    if (!product) return;
    const initialProductForm: ProductForm = {
      productName: product.productName,
      tagNumber: product.tagNumber ?? "",
      mdbDocumentNumber: product.mdbDocumentNumber ?? "",
      unitsEnabled: product.unitsEnabled,
      unitCount: product.unitsEnabled ? Math.max(1, product.unitCount) : 1,
      unitNumberingMode: product.unitsEnabled ? product.unitNumberingMode : "auto",
      unitNumberPrefix: product.unitsEnabled ? (product.unitNumberPrefix ?? "") : "",
      customUnitNumbers:
        product.unitsEnabled && product.unitNumberingMode === "custom"
          ? alignCustomUnitNumbers(product.customUnitNumbers ?? [], Math.max(1, product.unitCount))
          : [],
    };
    setProductEditForm(initialProductForm);
    setProductEditBaseline(initialProductForm);
    setProductEditOpen(true);
  }, [product]);

  const isProductEditDirty = useMemo(() => {
    if (!productEditBaseline) return false;
    return JSON.stringify(productEditForm) !== JSON.stringify(productEditBaseline);
  }, [productEditForm, productEditBaseline]);

  const requestCloseProductEditDialog = useCallback(() => {
    if (savingProductEdit) return;

    if (isProductEditDirty) {
      setProductEditUnsavedDialogOpen(true);
      return;
    }

    setProductEditOpen(false);
  }, [savingProductEdit, isProductEditDirty]);

  const discardProductEditChanges = useCallback(() => {
    if (productEditBaseline) {
      setProductEditForm(productEditBaseline);
    }
    setProductEditUnsavedDialogOpen(false);
    setProductEditOpen(false);
  }, [productEditBaseline]);

  const handleSaveProductEdit = useCallback(async () => {
    if (!product) return;
    if (!productEditForm.productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const unitCount = Math.max(1, Math.min(500, Number(productEditForm.unitCount) || 1));
    const customUnitNumbers = productEditForm.customUnitNumbers
      .slice(0, unitCount)
      .map((v) => v.trim());
    const emptyCount = countEmptyCustomUnitNumbers(productEditForm);

    if (productEditForm.unitsEnabled && productEditForm.unitNumberingMode === "custom") {
      if (emptyCount > 0) {
        setProductEditValidationMissing(emptyCount);
        setProductEditValidationOpen(true);
        return;
      }
      if (new Set(customUnitNumbers).size !== customUnitNumbers.length) {
        toast.error("Unit numbers must be unique");
        return;
      }
    }

    setSavingProductEdit(true);
    const { product: updated, error } = await updateProduct(product.id, {
      productName: productEditForm.productName.trim(),
      tagNumber: productEditForm.tagNumber.trim() || null,
      mdbDocumentNumber: productEditForm.mdbDocumentNumber.trim() || null,
      unitsEnabled: productEditForm.unitsEnabled,
      unitCount: productEditForm.unitsEnabled ? unitCount : 1,
      unitNumberingMode: productEditForm.unitsEnabled ? productEditForm.unitNumberingMode : "auto",
      unitNumberPrefix:
        productEditForm.unitsEnabled && productEditForm.unitNumberingMode !== "custom"
          ? (productEditForm.unitNumberPrefix.trim() || null)
          : null,
      customUnitNumbers:
        productEditForm.unitsEnabled && productEditForm.unitNumberingMode === "custom"
          ? customUnitNumbers
          : null,
    });
    setSavingProductEdit(false);

    if (error || !updated) {
      toast.error("Failed to update product", { description: error ?? undefined });
      return;
    }

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            productName: updated.productName,
            tagNumber: updated.tagNumber,
            mdbDocumentNumber: updated.mdbDocumentNumber,
            unitsEnabled: updated.unitsEnabled,
            unitCount: updated.unitCount,
            unitNumberingMode: updated.unitNumberingMode,
            unitNumberPrefix: updated.unitNumberPrefix,
            customUnitNumbers: updated.customUnitNumbers,
          }
        : prev
    );
    setProductEditOpen(false);
    toast.success("Product settings saved");
  }, [product, productEditForm]);

  const handleSaveBrandingSettings = useCallback(async () => {
    if (!product) {
      toast.error("Project details are still loading");
      return;
    }

    setSavingBrandingSettings(true);
    const { branding: savedBranding, error: brandingError } = await saveBrandingSettings({
      companyName: settingsBranding.companyName?.trim() || null,
      logoUrl: settingsBranding.logoUrl,
      primaryColor: settingsBranding.primaryColor,
      isFirstTime: false,
      marketingConsent: settingsBranding.marketingConsent,
    });
    const normalizedProjectStyle = normalizeProjectDocumentStyle(projectStyleDraft);
    const { project: updatedProject, error: projectError } = await updateProject(product.projectId, {
      coverStyle: normalizedProjectStyle.coverStyle,
      dividerStyle: normalizedProjectStyle.dividerStyle,
      fontFamily: normalizedProjectStyle.fontFamily,
    });
    setSavingBrandingSettings(false);

    if (brandingError || !savedBranding || projectError || !updatedProject) {
      toast.error("Failed to save settings", {
        description: brandingError ?? projectError ?? undefined,
      });
      return;
    }

    setBranding(savedBranding);
    setSettingsBranding(savedBranding);
    setProjectStyle(normalizedProjectStyle);
    setProjectStyleDraft(normalizedProjectStyle);
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            coverStyle: updatedProject.coverStyle,
            dividerStyle: updatedProject.dividerStyle,
            fontFamily: updatedProject.fontFamily,
          }
        : prev
    );
    setBrandingSettingsOpen(false);
    toast.success("Settings saved");
  }, [product, projectStyleDraft, settingsBranding]);

  const isBuilderSettingsDirty = useMemo(() => {
    const draftStyle = normalizeProjectDocumentStyle(projectStyleDraft);
    const savedStyle = normalizeProjectDocumentStyle(projectStyle);

    return (
      (settingsBranding.companyName ?? "") !== (branding.companyName ?? "") ||
      (settingsBranding.logoUrl ?? null) !== (branding.logoUrl ?? null) ||
      settingsBranding.primaryColor !== branding.primaryColor ||
      (settingsBranding.marketingConsent ?? false) !== (branding.marketingConsent ?? false) ||
      draftStyle.coverStyle !== savedStyle.coverStyle ||
      draftStyle.dividerStyle !== savedStyle.dividerStyle ||
      draftStyle.fontFamily !== savedStyle.fontFamily
    );
  }, [branding, settingsBranding, projectStyleDraft, projectStyle]);

  const requestCloseBrandingSettings = useCallback(() => {
    if (savingBrandingSettings) return;

    if (isBuilderSettingsDirty) {
      setSettingsUnsavedDialogOpen(true);
      return;
    }

    setBrandingSettingsOpen(false);
  }, [isBuilderSettingsDirty, savingBrandingSettings]);

  const discardBuilderSettingsChanges = useCallback(() => {
    setSettingsBranding(branding);
    setProjectStyleDraft(projectStyle);
    setSettingsUnsavedDialogOpen(false);
    setBrandingSettingsOpen(false);
  }, [branding, projectStyle]);

  const openSettingsDialog = useCallback(() => {
    setSettingsBranding(branding);
    setProjectStyleDraft(projectStyle);
    setBrandingSettingsOpen(true);
  }, [branding, projectStyle]);

  const handleBuilderBrandingLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsBranding((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleExportPdf = useCallback(() => {
    if (state.sections.length === 0) {
      toast.error("Add at least one section before exporting");
      return;
    }
    setExportFormat("pdf");
    setSelectedUnitNumbers(unitNumbers);
    setExportDialogOpen(true);
  }, [state.sections.length, unitNumbers]);

  const handleConfirmExport = useCallback(async () => {
    const hasMultipleUnits = unitNumbers.length > 1;

    if (hasMultipleUnits && selectedUnitNumbers.length === 0) {
      toast.error("Select at least one unit");
      return;
    }

    const isPdfMode = exportFormat === "pdf";
    if (isPdfMode) {
      setGenerating(true);
    } else {
      setGeneratingZip(true);
    }

    const docBase = product?.mdbDocumentNumber || state.info.documentNumber || "MDB";

    try {
      if (isPdfMode) {
        if (!hasMultipleUnits) {
          // No units or single unit
          const unitNumber = unitNumbers[0];
          if (unitNumber) {
            const baseName = sanitizeExportFileName(`${docBase}_${unitNumber}`);
            await generatePdf(buildExportState(unitNumber), { filename: `${baseName}.pdf` });
          } else {
            await generatePdf(buildExportState());
          }
          toast.success("PDF exported successfully!", {
            description: `${chapterCount} chapters with bookmarks`,
          });
        } else if (selectedUnitNumbers.length === 1) {
          const onlyUnit = selectedUnitNumbers[0];
          const baseName = sanitizeExportFileName(`${docBase}_${onlyUnit}`);
          await generatePdf(buildExportState(onlyUnit), { filename: `${baseName}.pdf` });
          toast.success("PDF exported successfully!", {
            description: `${chapterCount} chapters with bookmarks`,
          });
        } else {
          const zip = new JSZip();
          const usedNames = new Set<string>();
          for (const unitNumber of selectedUnitNumbers) {
            const blob = await generatePdfBlob(buildExportState(unitNumber));
            const bytes = new Uint8Array(await blob.arrayBuffer());
            let fileBaseName = sanitizeExportFileName(`${docBase}_${unitNumber}`);
            if (usedNames.has(fileBaseName)) {
              let suffix = 2;
              while (usedNames.has(`${fileBaseName}_${suffix}`)) suffix += 1;
              fileBaseName = `${fileBaseName}_${suffix}`;
            }
            usedNames.add(fileBaseName);
            zip.file(`${fileBaseName}.pdf`, bytes);
          }
          const zipBlob = await zip.generateAsync({ type: "blob" });
          downloadFileBlob(zipBlob, `${sanitizeExportFileName(`${docBase}_Units_PDF`)}.zip`);
          toast.success("Export completed", {
            description: `Exported ${selectedUnitNumbers.length} unit PDFs in ZIP`,
          });
        }
      } else {
        // Separate PDFs mode
        if (!hasMultipleUnits) {
          await generatePdfZip(buildExportState(unitNumbers[0]));
          toast.success("Export completed", {
            description: "Each chapter exported as a separate PDF",
          });
        } else {
          const zip = new JSZip();
          const usedFolderNames = new Set<string>();
          for (const unitNumber of selectedUnitNumbers) {
            let folderName = sanitizeExportFileName(unitNumber);
            if (usedFolderNames.has(folderName)) {
              let suffix = 2;
              while (usedFolderNames.has(`${folderName}_${suffix}`)) suffix += 1;
              folderName = `${folderName}_${suffix}`;
            }
            usedFolderNames.add(folderName);
            const unitEntries = await generatePdfZipEntries(buildExportState(unitNumber));
            const folder = zip.folder(folderName);
            unitEntries.forEach((entry) => { folder?.file(entry.filename, entry.bytes); });
          }
          const zipBlob = await zip.generateAsync({ type: "blob" });
          downloadFileBlob(zipBlob, `${sanitizeExportFileName(`${docBase}_Units`)}.zip`);
          toast.success("Export completed", {
            description:
              selectedUnitNumbers.length === 1
                ? "Exported 1 unit folder in ZIP"
                : `Exported ${selectedUnitNumbers.length} unit folders in ZIP`,
          });
        }
      }
      setExportDialogOpen(false);
    } catch {
      toast.error(isPdfMode ? "Failed to export PDF" : "Failed to export");
    } finally {
      if (isPdfMode) {
        setGenerating(false);
      } else {
        setGeneratingZip(false);
      }
    }
  }, [
    unitNumbers,
    selectedUnitNumbers,
    exportFormat,
    buildExportState,
    product?.mdbDocumentNumber,
    state.info.documentNumber,
    chapterCount,
  ]);

  const allUnitsSelected = unitNumbers.length > 0 && selectedUnitNumbers.length === unitNumbers.length;

  const toggleAllUnitsSelection = useCallback(() => {
    if (allUnitsSelected) {
      setSelectedUnitNumbers([]);
    } else {
      setSelectedUnitNumbers(unitNumbers);
    }
  }, [allUnitsSelected, unitNumbers]);

  const toggleUnitSelection = useCallback((unitNumber: string) => {
    setSelectedUnitNumbers((prev) =>
      prev.includes(unitNumber)
        ? prev.filter((value) => value !== unitNumber)
        : [...prev, unitNumber]
    );
  }, []);

  // Load product data on mount and pre-fill MDB state
  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (!cancelled) setLoadingProduct(false);
        return;
      }

      if (!productId) {
        if (!cancelled) setLoadingProduct(false);
        return;
      }

      setLoadingProduct(true);
      baselineStateRef.current = null;
      restoredDraftRef.current = false;
      resetProject();

      try {
        const { product: p, error } = await getProduct(productId);

        if (cancelled) return;

        if (error || !p) {
          toast.error("Failed to load product", { description: error ?? undefined });
          navigate("/projects");
          return;
        }

        setProduct(p);
        const normalizedProjectStyle = normalizeProjectDocumentStyle({
          coverStyle: p.coverStyle,
          dividerStyle: p.dividerStyle,
          fontFamily: p.fontFamily,
        });
        setProjectStyle(normalizedProjectStyle);
        setProjectStyleDraft(normalizedProjectStyle);

        const hasValidMdbStateShape = (value: unknown) =>
          !!value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          Array.isArray((value as { sections?: unknown }).sections) &&
          Array.isArray((value as { chapterOrder?: unknown }).chapterOrder) &&
          typeof (value as { info?: unknown }).info === "object";

        const serverSnapshot = hasValidMdbStateShape(p.mdbData)
          ? JSON.stringify(p.mdbData)
          : null;

        // Restore unsaved local draft first; fallback to saved server state.
        let restoredLocalDraft = false;
        if (draftStorageKey) {
          try {
            const rawDraft = localStorage.getItem(draftStorageKey);
            if (rawDraft) {
              const parsedDraft = JSON.parse(rawDraft);
              if (hasValidMdbStateShape(parsedDraft)) {
                loadState(parsedDraft as Parameters<typeof loadState>[0]);
                restoredLocalDraft = true;
              } else {
                localStorage.removeItem(draftStorageKey);
              }
            }
          } catch {
            localStorage.removeItem(draftStorageKey);
          }
        }

        restoredDraftRef.current = restoredLocalDraft;

        if (!restoredLocalDraft && hasValidMdbStateShape(p.mdbData)) {
          loadState(p.mdbData as Parameters<typeof loadState>[0]);
        } else if (!restoredLocalDraft) {
          // Pre-fill info from product metadata for a new MDB
          setInfo({
            projectName: p.projectName,
            clientName: p.projectCustomerName,
            documentNumber: p.mdbDocumentNumber || "",
          });
        }

        // If we restored a local draft, keep the baseline anchored to persisted server state.
        // This ensures unsaved warning still appears until the user explicitly saves.
        if (restoredLocalDraft) {
          baselineStateRef.current = serverSnapshot ?? "__LOCAL_DRAFT_NO_SERVER_SNAPSHOT__";
        }
      } catch (error) {
        if (cancelled) return;
        toast.error("Failed to load product", { description: String(error) });
        navigate("/projects");
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, authLoading, user, loadState, navigate, resetProject, setInfo, draftStorageKey]);

  useEffect(() => {
    if (authLoading || loadingProduct) return;
    if (baselineStateRef.current === null) {
      baselineStateRef.current = currentStateSnapshot;
      restoredDraftRef.current = false;
    }
  }, [authLoading, loadingProduct, currentStateSnapshot]);

  useEffect(() => {
    if (!draftStorageKey || authLoading || loadingProduct) return;

    if (hasUnsavedChanges) {
      localStorage.setItem(draftStorageKey, currentStateSnapshot);
      return;
    }

    localStorage.removeItem(draftStorageKey);
  }, [draftStorageKey, authLoading, loadingProduct, hasUnsavedChanges, currentStateSnapshot]);

  const handleSaveMdb = useCallback(async () => {
    if (!productId) return false;
    setSaving(true);
    const { error } = await saveMdbData(productId, state);
    setSaving(false);
    if (error) {
      toast.error("Save failed", { description: error });
      return false;
    } else {
      baselineStateRef.current = JSON.stringify(state);
      restoredDraftRef.current = false;
      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }
      toast.success("MDB saved");
      return true;
    }
  }, [productId, state, draftStorageKey]);

  const handleSaveAndExit = useCallback(async () => {
    setSavingBeforeExit(true);
    const saved = await handleSaveMdb();
    setSavingBeforeExit(false);
    if (!saved) return;
    await executePendingExit();
  }, [handleSaveMdb, executePendingExit]);

  const handleDiscardAndExit = useCallback(() => {
    // Explicit discard should not be restored when returning to this product.
    if (draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }
    baselineStateRef.current = currentStateSnapshot;
    restoredDraftRef.current = false;
    void executePendingExit();
  }, [executePendingExit, draftStorageKey, currentStateSnapshot]);

  const handleCancelExit = useCallback(() => {
    pendingExitActionRef.current = null;
    setUnsavedDialogOpen(false);
  }, []);

  // Avoid beforeunload listeners so browser back/forward cache can keep this page warm.

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) return null;
  if (!user) return null;

  if (loadingProduct) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground gap-3">
        <span className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading MDB…
      </div>
    );
  }

  const projectName = product?.projectName || state.info.projectName || "-";
  const clientName = product?.projectCustomerName || state.info.clientName || "-";
  const productName = product?.productName || "-";
  const tagNumber = product?.tagNumber || "-";
  const documentNumber = product?.mdbDocumentNumber || state.info.documentNumber || "-";

  const categories = libraryCategories;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="relative h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => requestExit(() => navigate("/projects"))}
          >
            <ChevronLeft className="h-4 w-4" />
            <BizzBitLogo textSizeClassName="text-2xl" className="h-8" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="text-sm font-[var(--font-mono)] text-muted-foreground">
            MDB Builder
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground/80 font-[var(--font-mono)] max-w-[56vw] min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border/60 bg-muted/30 truncate min-w-0">
            <span className="text-muted-foreground/60">Project</span>
            <span className="truncate text-xs font-semibold text-foreground">{projectName}</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="truncate">{clientName}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border/60 bg-muted/30 truncate min-w-0">
            <span className="text-muted-foreground/60">Product</span>
            <span className="truncate text-xs font-semibold text-foreground">{productName}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>{tagNumber}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>{documentNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 z-10">
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" onClick={openSettingsDialog}>
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Button>
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleSaveMdb();
            }}
            disabled={saving || loadingProduct}
            className="gap-1.5 bg-transparent"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            onClick={handleExportPdf}
            disabled={generating || generatingZip || state.sections.length === 0}
            className="gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            {generating || generatingZip ? "Exporting..." : "Export PDF"}
          </Button>
          <div className="h-5 w-px bg-border ml-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  requestExit(async () => {
                    await logout();
                    navigate("/");
                  })
                }
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Upgrade Banner */}
      <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-center gap-4 text-sm z-30">
        <div className="flex items-center gap-3">
          <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-foreground/80">
            <span className="font-medium text-foreground">BizzBit Builder is free.</span>{" "}
            The full BizzBit platform adds MDB content management, digital ITP, ISO 9001 NCR tracking, and more.
          </span>
        </div>
        <a
          href="https://www.bizzbit.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary hover:underline font-medium whitespace-nowrap flex items-center gap-1"
        >
          Learn more <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Section Library */}
        {sidebarOpen && (
          <aside className="w-80 border-r border-border/50 bg-card/30 flex flex-col shrink-0">
            <div className="p-3 border-b border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Section Library</h3>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs bg-transparent"
                    onClick={openCreateCategoryDialog}
                  >
                    <Plus className="h-3 w-3" />
                    Category
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs bg-transparent"
                    onClick={() => setTemplateDialogOpen(true)}
                  >
                    <LayoutTemplate className="h-3 w-3" />
                    Templates
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search sections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-input/50"
                />
              </div>
              {/* Category filters */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeCategory === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveCategory(cat.key)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      activeCategory === cat.key
                        ? "text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                    style={
                      activeCategory === cat.key
                        ? { backgroundColor: cat.color }
                        : undefined
                    }
                  >
                      {cat.name}
                    </button>
                    <button
                      onClick={() => openEditCategoryDialog(cat)}
                      className="p-1 text-muted-foreground/40 hover:text-muted-foreground"
                      title="Edit category"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs bg-transparent"
                  onClick={openCreateSectionDialog}
                  disabled={libraryCategories.length === 0}
                >
                  <Plus className="h-3 w-3" />
                  Section
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2 space-y-1">
                {libraryLoading && (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading section library...</p>
                )}
                {!libraryLoading && filteredSections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onEdit={() => openEditSectionDialog(section)}
                    onAdd={() => {
                      ensureChapterForLibraryCategory(
                        section.categoryKey,
                        section.categoryName,
                        section.categoryColor
                      );
                      addSection({
                        id: section.key,
                        title: section.title,
                        code: section.code,
                        category: section.categoryKey,
                        description: section.description,
                        suggestedSections: section.suggestedSections || undefined,
                      });
                      toast.success(`Added: ${section.title}`);
                    }}
                  />
                ))}
                {!libraryLoading && filteredSections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {selectedIds.size > 0
                      ? "All matching sections are already added"
                      : "No sections found"}
                  </p>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Center — Builder */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto p-6">
              {/* Chapters & Subchapters */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Chapters ({chapterCount})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs bg-transparent"
                      onClick={() => {
                        const chapterId = addChapter();
                        toast.success(`Added chapter: ${getChapterTitle(chapterId)}`);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Main Chapter
                    </Button>
                    {!sidebarOpen && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs bg-transparent"
                        onClick={() => setSidebarOpen(true)}
                      >
                        <Plus className="h-3 w-3" />
                        Add Sections
                      </Button>
                    )}
                  </div>
                </div>

                {state.sections.length === 0 ? (
                  <div className="border border-dashed border-border rounded-xl p-12 text-center">
                    <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                {/* Locked Premium Features */}
                <div className="mx-auto mb-6 max-w-2xl border-b border-border/50 p-4">
                  <h3 className="mb-2 flex items-center justify-center gap-1.5 text-sm font-semibold">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Full Platform Features
                  </h3>
                  <div className="space-y-2 text-left">
                    {[
                      {
                        title: "MDB Content Management",
                        desc: "Fill your MDB with actual project content — certificates, test records, and traceability data.",
                      },
                      {
                        title: "MDB Index Generator (ITP)",
                        desc: "Auto-build your MDB index from a connected digital Inspection & Test Plan.",
                      },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className="rounded-lg border border-border/50 bg-muted/10 p-2.5 opacity-60"
                      >
                        <div className="flex items-start gap-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-foreground">{feature.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{feature.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <a
                      href="https://www.bizzbit.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full mt-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Learn about the full platform
                    </a>
                  </div>
                </div>

                    <p className="text-muted-foreground mb-4">
                      No sections added yet. Start with a template or add
                      sections from the library.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplateDialogOpen(true)}
                        className="gap-1.5 bg-transparent"
                      >
                        <LayoutTemplate className="h-3.5 w-3.5" />
                        Choose Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {indexSection && (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/50">
                        <GripVertical className="h-4 w-4 text-muted-foreground/20 cursor-not-allowed shrink-0" />
                        <div
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: getChapterColor("general") }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-[var(--font-mono)] text-xs text-muted-foreground">IDX</span>
                            <span className="font-[var(--font-mono)] text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {indexSection.code}
                            </span>
                            <span className="text-sm font-medium truncate">{indexSection.title}</span>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs text-xs">
                            {indexSection.description}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {state.chapterOrder.map((category, chapterDropIndex) => {
                      const chapterSections = sectionsByCategory[category];
                      const chapterNumber = chapterNumbers.get(category);
                      const isChapterDragMode = draggingChapter !== null;

                      return (
                        <motion.div
                          key={category}
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.7 }}
                          className="space-y-0.5"
                        >
                          <div
                            className="h-2 rounded bg-transparent"
                            onMouseEnter={() => {
                              if (!isChapterPointerDragging || !draggingChapter) return;
                              previewMoveChapter(draggingChapter, chapterDropIndex);
                            }}
                            onDragOver={(e) => {
                              if (!draggingChapter) return;
                              e.preventDefault();
                              e.stopPropagation();
                              previewMoveChapter(draggingChapter, chapterDropIndex);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!draggingChapter) return;
                              moveChapter(draggingChapter, chapterDropIndex);
                              setDraggingChapter(null);
                              setDragChapterPreviewTarget(null);
                            }}
                          />

                          <div
                            className="rounded-lg border border-border/60 bg-card/60"
                            onDragOver={(e) => {
                              if (!draggingSectionId) return;
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!draggingSectionId) return;
                              if (chapterSections.length === 0) {
                                moveSection(draggingSectionId, category, 0);
                              }
                              setDraggingSectionId(null);
                              setDragPreviewTarget(null);
                            }}
                          >
                            <div
                              onMouseEnter={() => {
                                if (!isChapterPointerDragging || !draggingChapter) return;
                                previewMoveChapter(draggingChapter, chapterDropIndex);
                              }}
                              onDragOver={(e) => {
                                if (!draggingChapter) return;
                                e.preventDefault();
                                e.stopPropagation();
                                previewMoveChapter(draggingChapter, chapterDropIndex);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDraggingChapter(null);
                                setDragChapterPreviewTarget(null);
                              }}
                              className="flex items-center gap-2 px-2.5 py-1.5 border-b border-border/50"
                            >
                              <div
                                draggable
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDraggingChapter(category);
                                  setIsChapterPointerDragging(true);
                                  setDragChapterPreviewTarget(null);
                                }}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setDraggingChapter(category);
                                  setDragChapterPreviewTarget(null);
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation();
                                  setIsChapterPointerDragging(false);
                                  setDraggingChapter(null);
                                  setDragChapterPreviewTarget(null);
                                }}
                                className="shrink-0"
                                title="Drag main chapter"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                              </div>
                              <div
                                className="w-1.5 h-6 rounded-full shrink-0"
                                style={{ backgroundColor: getChapterColor(category) }}
                              />
                              <span className="font-[var(--font-mono)] text-xs text-muted-foreground">
                                {chapterNumber ? String(chapterNumber).padStart(2, "0") : "--"}
                              </span>
                              <Input
                                value={getChapterTitle(category)}
                                onChange={(e) => updateChapterTitle(category, e.target.value)}
                                className="h-7 px-2 py-0 text-sm bg-input/50 border-border/50 max-w-xs"
                              />
                              <input
                                type="color"
                                value={getChapterColor(category)}
                                onChange={(e) => updateChapterColor(category, e.target.value)}
                                className="h-7 w-8 p-0 bg-transparent border border-border/50 rounded"
                                title="Chapter color"
                              />
                              <span className="text-xs text-muted-foreground">({chapterSections.length})</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  openCreateSubchapterDialog(category);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Subchapter
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => {
                                  removeChapter(category);
                                  toast.success(`Removed chapter: ${getChapterTitle(category)}`);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>

                            {!isChapterDragMode && (
                              <div className="p-1 space-y-0.5">
                                {chapterSections.length === 0 ? (
                                  <div className="text-xs text-muted-foreground px-2 py-3 border border-dashed border-border rounded-md">
                                    Drop subchapters here
                                  </div>
                                ) : (
                                  chapterSections.map((section, subIndex) => (
                                    <motion.div
                                      key={section.id}
                                      layout="position"
                                      transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.65 }}
                                      className="space-y-0.5"
                                    >
                                      <div
                                        className="h-0.5 rounded bg-transparent"
                                        onDragOver={(e) => {
                                          if (!draggingSectionId) return;
                                          e.preventDefault();
                                          e.stopPropagation();
                                          previewMoveSection(draggingSectionId, category, subIndex);
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (!draggingSectionId) return;
                                          moveSection(draggingSectionId, category, subIndex);
                                          setDraggingSectionId(null);
                                          setDragPreviewTarget(null);
                                        }}
                                      />

                                      <div
                                        draggable
                                        onDragStart={() => {
                                          setDraggingSectionId(section.id);
                                          setDragPreviewTarget(null);
                                        }}
                                        onDragEnd={() => {
                                          setDraggingSectionId(null);
                                          setDragPreviewTarget(null);
                                        }}
                                        onDragOver={(e) => {
                                          if (!draggingSectionId) return;
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDraggingSectionId(null);
                                          setDragPreviewTarget(null);
                                        }}
                                        className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/50 hover:border-border group"
                                      >
                                        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-[var(--font-mono)] text-xs text-muted-foreground">
                                              {chapterNumber ? `${chapterNumber}.${subIndex + 1}` : `?.${subIndex + 1}`}
                                            </span>
                                            <span className="font-[var(--font-mono)] text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                              {section.code}
                                            </span>
                                            <span className="text-sm truncate">{section.title}</span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => openEditSubchapterDialog(section)}
                                          className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                          title="Edit subchapter details"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                              <Info className="h-3.5 w-3.5" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="left" className="max-w-xs text-xs">
                                            {section.description}
                                          </TooltipContent>
                                        </Tooltip>
                                        <button
                                          onClick={() => removeSection(section.id)}
                                          className="p-1 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))
                                )}

                                <div
                                  className="h-0.5 rounded bg-transparent"
                                  onDragOver={(e) => {
                                    if (!draggingSectionId) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    previewMoveSection(draggingSectionId, category, chapterSections.length);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!draggingSectionId) return;
                                    moveSection(draggingSectionId, category, chapterSections.length);
                                    setDraggingSectionId(null);
                                    setDragPreviewTarget(null);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    <div
                      className="h-2 rounded bg-transparent"
                      onMouseEnter={() => {
                        if (!isChapterPointerDragging || !draggingChapter) return;
                        previewMoveChapter(draggingChapter, state.chapterOrder.length);
                      }}
                      onDragOver={(e) => {
                        if (!draggingChapter) return;
                        e.preventDefault();
                        e.stopPropagation();
                        previewMoveChapter(draggingChapter, state.chapterOrder.length);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!draggingChapter) return;
                        moveChapter(draggingChapter, state.chapterOrder.length);
                        setDraggingChapter(null);
                        setDragChapterPreviewTarget(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel — Preview & Score */}
        <aside className="w-80 border-l border-border/50 bg-card/30 flex flex-col shrink-0 hidden xl:flex overflow-y-auto">
          {/* Product Info */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Product</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-transparent h-7 px-2"
                onClick={openProductEditDialog}
                disabled={!product}
              >
                <Settings className="h-3 w-3" />
                Edit
              </Button>
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <div className="font-medium text-foreground truncate">{product?.productName || "-"}</div>
              <div className="font-[var(--font-mono)]">{product?.tagNumber || "-"}</div>
              <div className="font-[var(--font-mono)] truncate">{product?.mdbDocumentNumber || "-"}</div>
              {product?.unitsEnabled && (
                <div>
                  {product.unitCount} unit{product.unitCount !== 1 ? "s" : ""}
                  {product.unitNumberingMode === "custom" ? " (custom)" : " (auto)"}
                </div>
              )}
            </div>
          </div>
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold mb-3">Completeness Score</h3>
            <div className="flex items-center gap-3 mb-2">
              <Progress value={completenessScore} className="flex-1 h-2" />
              <span
                className={`text-sm font-bold font-[var(--font-mono)] ${
                  completenessScore >= 80
                    ? "text-green-400"
                    : completenessScore >= 50
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {completenessScore}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {completenessScore >= 80
                ? "Your MDB structure is audit-ready"
                : completenessScore >= 50
                ? "Good progress — add more sections for full coverage"
                : "Add sections to improve completeness"}
            </p>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4 border-b border-border/50">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <AlertTriangle className="h-3 w-3 text-amber-400/60 mt-0.5 shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini Preview */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold mb-3">Document Preview</h3>
            <div className="bg-white rounded-lg p-3 text-black text-[8px] leading-tight shadow-lg aspect-[3/4] overflow-hidden">
              {/* Mini cover page */}
              <div
                className="h-1.5 rounded-sm mb-2"
                style={{ backgroundColor: state.primaryColor }}
              />
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt=""
                  className="h-4 object-contain mb-1"
                />
              )}
              {branding.companyName && (
                <div className="text-[7px] font-semibold mb-1 truncate">{branding.companyName}</div>
              )}
              <div className="font-bold text-[9px] mb-0.5">
                {state.info.projectName || "Project Name"}
              </div>
              <div className="text-gray-500 mb-2">
                {state.info.documentNumber} Rev. {state.info.revision}
              </div>
              <div
                className="h-px mb-1.5"
                style={{ backgroundColor: state.primaryColor + "40" }}
              />
              <div className="font-bold text-[7px] text-gray-600 mb-1">
                TABLE OF CONTENTS
              </div>
              {(() => {
                const nonIndex = state.sections.filter(s => s.id !== "mdb-index");
                const rows: React.ReactNode[] = [];
                let chapterNum = 0;
                let shown = 0;
                const max = 18;
                for (const category of state.chapterOrder) {
                  if (shown >= max) break;
                  chapterNum++;
                  const chapterTitle = state.chapterMeta[category]?.title || CATEGORY_LABELS[category] || category;
                  rows.push(
                    <div key={`ch-${category}`} className="flex gap-1 mb-0.5">
                      <span className="text-gray-500 font-bold shrink-0">{chapterNum}.</span>
                      <span className="font-bold text-gray-700 truncate">{chapterTitle}</span>
                    </div>
                  );
                  shown++;
                  const subs = nonIndex.filter(s => s.category === category);
                  subs.forEach((s, si) => {
                    if (shown >= max) return;
                    rows.push(
                      <div key={s.id} className="flex gap-1 mb-0.5 pl-2">
                        <span className="text-gray-400 shrink-0">{chapterNum}.{si + 1}</span>
                        <span className="text-gray-500 truncate">{s.title}</span>
                      </div>
                    );
                    shown++;
                  });
                }
                const total = state.chapterOrder.length + nonIndex.length;
                if (total > max) rows.push(
                  <div key="more" className="text-gray-400 mt-0.5">+{total - max} more…</div>
                );
                return rows;
              })()}
            </div>
          </div>
        </aside>
      </div>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Select an industry-specific template to pre-load recommended MDB
              sections. You can customize the structure afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            {SECTOR_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateSelect(t.id)}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-accent/30 transition-all text-left group"
              >
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.description}
                  </div>
                  <div className="text-[11px] text-muted-foreground/60 mt-1 font-[var(--font-mono)]">
                    {t.sectionIds.length} sections
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templateWarningOpen} onOpenChange={setTemplateWarningOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Replace current chapters?</DialogTitle>
            <DialogDescription>
              Applying a template replaces your current chapters and subchapters. Some existing content may be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelTemplateApply}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmTemplateApply}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setCategoryDialogOpen(true);
            return;
          }
          requestCloseCategoryDialog();
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update this category for your personal section library."
                : "Create a new category for your personal section library."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Category Name</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Procurement"
                className="bg-input/50"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Category Color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryColor(color)}
                    className={`h-8 w-8 rounded-md border-2 transition-transform ${
                      categoryColor === color ? "border-foreground scale-110" : "border-transparent"
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
                  <span className="block h-full w-full" style={{ backgroundColor: categoryColor }} />
                  <Input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Custom category color"
                  />
                </label>
              </div>
            </div>
            <Button onClick={saveCategory} className="w-full" disabled={savingLibrary}>
              {savingLibrary ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelExit();
            return;
          }
          setUnsavedDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved MDB changes. Do you want to save before leaving this page?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={handleCancelExit}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleDiscardAndExit}>
              Leave without saving
            </Button>
            <Button onClick={handleSaveAndExit} disabled={savingBeforeExit || saving}>
              {savingBeforeExit || saving ? "Saving..." : "Save and leave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Export PDF</DialogTitle>
            <DialogDescription>
              Choose how to export your MDB document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Format selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportFormat("pdf")}
                className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${
                  exportFormat === "pdf"
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/40 hover:bg-accent/30"
                }`}
              >
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <FileDown className="h-4 w-4" /> Single PDF
                </span>
                <span className="text-xs text-muted-foreground">One file with bookmarks</span>
              </button>
              <button
                onClick={() => setExportFormat("zip")}
                className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${
                  exportFormat === "zip"
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/40 hover:bg-accent/30"
                }`}
              >
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Archive className="h-4 w-4" /> Separate PDFs
                </span>
                <span className="text-xs text-muted-foreground">One PDF per chapter</span>
              </button>
            </div>

            {/* Unit selection — only shown for multi-unit products */}
            {unitNumbers.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Units</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {selectedUnitNumbers.length} of {unitNumbers.length} selected
                    </span>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={toggleAllUnitsSelection}>
                      {allUnitsSelected ? "Unselect all" : "Select all"}
                    </Button>
                  </div>
                </div>
                <div className="max-h-60 overflow-auto rounded-md border border-border/60 p-2 space-y-1">
                  {unitNumbers.map((unitNumber) => (
                    <label
                      key={unitNumber}
                      className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-accent/40 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUnitNumbers.includes(unitNumber)}
                        onChange={() => toggleUnitSelection(unitNumber)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm font-[var(--font-mono)]">{unitNumber}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={
                (generating || generatingZip) ||
                (unitNumbers.length > 1 && selectedUnitNumbers.length === 0)
              }
            >
              {generating || generatingZip ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sectionDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setSectionDialogOpen(true);
            return;
          }
          requestCloseSectionDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
            <DialogDescription>
              {editingSection
                ? "Update this section in your personal section library."
                : "Create a reusable section in your personal section library."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Category</Label>
              <select
                value={sectionCategoryId}
                onChange={(e) => setSectionCategoryId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-input/50 px-3 text-sm"
              >
                {libraryCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Section Title</Label>
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Procurement Plan"
                  className="bg-input/50"
                />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Code</Label>
                <Input
                  value={sectionCode}
                  onChange={(e) => setSectionCode(e.target.value)}
                  placeholder="e.g. PRC"
                  className="bg-input/50 font-[var(--font-mono)]"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Description</Label>
              <Input
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                placeholder="Describe what this section contains"
                className="bg-input/50"
              />
            </div>
            <Button onClick={saveSection} className="w-full" disabled={savingLibrary}>
              {savingLibrary ? "Saving..." : "Save Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={libraryUnsavedDialogOpen}
        onOpenChange={(open) => {
          setLibraryUnsavedDialogOpen(open);
          if (!open) setPendingLibraryModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save before closing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLibraryUnsavedDialogOpen(false);
                setPendingLibraryModal(null);
              }}
            >
              Continue editing
            </Button>
            <Button
              onClick={async () => {
                setLibraryUnsavedDialogOpen(false);
                const targetModal = pendingLibraryModal;
                setPendingLibraryModal(null);

                if (targetModal === "category") {
                  await saveCategory();
                  return;
                }

                if (targetModal === "section") {
                  await saveSection();
                }
              }}
              disabled={savingLibrary}
            >
              {savingLibrary ? "Saving..." : "Save and close"}
            </Button>
            <Button variant="destructive" onClick={discardLibraryDialogChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={brandingSettingsOpen}
        onOpenChange={(open) => {
          if (open) {
            setBrandingSettingsOpen(true);
            return;
          }
          requestCloseBrandingSettings();
        }}
      >
        <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-6xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account branding and this project's document style studio in one place.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden py-1 pr-1">
            <div className="grid h-full min-h-0 gap-6 lg:grid-cols-2">
            <div className="min-h-0 space-y-6 overflow-y-auto pr-1 pb-4">
              <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Account Branding</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These settings apply to all MDB exports on your account.
                  </p>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Company Name</Label>
                  <Input
                    value={settingsBranding.companyName ?? ""}
                    onChange={(e) =>
                      setSettingsBranding((prev) => ({ ...prev, companyName: e.target.value || null }))
                    }
                    placeholder="e.g. BizzBit Engineering"
                    className="bg-input/50"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Company Logo</Label>
                  {settingsBranding.logoUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-3">
                      <img src={settingsBranding.logoUrl} alt="Company logo" className="h-12 max-w-32 rounded bg-white p-1 object-contain" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSettingsBranding((prev) => ({ ...prev, logoUrl: null }))}
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <label
                      className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors text-sm ${
                        builderBrandingLogoDragActive
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background/40 text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBuilderBrandingLogoDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBuilderBrandingLogoDragActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBuilderBrandingLogoDragActive(false);
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          const file = files[0];
                          if (file.type.startsWith("image/")) {
                            const syntheticEvent = {
                              target: { files: files },
                            } as unknown as React.ChangeEvent<HTMLInputElement>;
                            handleBuilderBrandingLogoUpload(syntheticEvent);
                          } else {
                            toast.error("Please drop an image file");
                          }
                        }
                      }}
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={handleBuilderBrandingLogoUpload} />
                      {builderBrandingLogoDragActive ? "Drop logo here" : "Upload Logo"}
                    </label>
                  )}
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Primary Brand Color</Label>
                  <BrandColorPalette
                    value={settingsBranding.primaryColor}
                    onChange={(color) => setSettingsBranding((prev) => ({ ...prev, primaryColor: color }))}
                    presets={COLOR_PRESETS}
                  />
                </div>
                <div className="pt-2 border-t border-border/50">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsBranding.marketingConsent ?? false}
                      onChange={(e) =>
                        setSettingsBranding((prev) => ({ ...prev, marketingConsent: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground font-medium">Marketing Communications</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        I'd like to receive occasional updates about the BizzBit platform and new features. You can unsubscribe at any time.
                      </div>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            <aside className="min-h-0 space-y-4 overflow-y-auto pr-1 pb-4 lg:max-h-[65vh]">
              <section className="space-y-5 rounded-2xl border border-border/70 bg-muted/10 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Project Style Studio</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This project's exports can use their own cover, divider, and typography settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm block">Cover Style</Label>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {COVER_STYLE_OPTIONS.map((option) => (
                      <StyleOptionCard
                        key={option.value}
                        selected={projectStyleDraft.coverStyle === option.value}
                        label={option.label}
                        description={option.description}
                        onClick={() => setProjectStyleDraft((prev) => ({ ...prev, coverStyle: option.value }))}
                      >
                        <CoverStylePreview
                          style={option.value}
                          color={settingsBranding.primaryColor}
                          fontFamily={projectStyleDraft.fontFamily}
                          companyName={settingsBranding.companyName?.trim() || "Your Company"}
                        />
                      </StyleOptionCard>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm block">Divider Style</Label>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {DIVIDER_STYLE_OPTIONS.map((option) => (
                      <StyleOptionCard
                        key={option.value}
                        selected={projectStyleDraft.dividerStyle === option.value}
                        label={option.label}
                        description={option.description}
                        onClick={() => setProjectStyleDraft((prev) => ({ ...prev, dividerStyle: option.value }))}
                      >
                        <DividerStylePreview
                          style={option.value}
                          color={settingsBranding.primaryColor}
                          fontFamily={projectStyleDraft.fontFamily}
                        />
                      </StyleOptionCard>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm block">Document Font</Label>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {FONT_FAMILY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProjectStyleDraft((prev) => ({ ...prev, fontFamily: option.value }))}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          projectStyleDraft.fontFamily === option.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/70 bg-background hover:border-primary/40"
                        }`}
                        style={{ fontFamily: option.previewFamily }}
                      >
                        <div className="text-sm font-semibold text-foreground">{option.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Manufacturing Data Book preview text
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </aside>
            </div>
          </div>
          <DialogFooter className="border-t border-border/60 bg-card pt-3">
            <Button variant="outline" onClick={requestCloseBrandingSettings}>
              Cancel
            </Button>
            <Button onClick={handleSaveBrandingSettings} disabled={savingBrandingSettings}>
              {savingBrandingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsUnsavedDialogOpen} onOpenChange={setSettingsUnsavedDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unsaved settings changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in Settings. Do you want to discard these changes and close?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsUnsavedDialogOpen(false)}>
              Continue editing
            </Button>
            <Button
              onClick={async () => {
                setSettingsUnsavedDialogOpen(false);
                await handleSaveBrandingSettings();
              }}
              disabled={savingBrandingSettings}
            >
              {savingBrandingSettings ? "Saving..." : "Save and close"}
            </Button>
            <Button variant="destructive" onClick={discardBuilderSettingsChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Settings Dialog */}
      <Dialog
        open={productEditOpen}
        onOpenChange={(open) => {
          if (open) {
            setProductEditOpen(true);
            return;
          }
          requestCloseProductEditDialog();
        }}
      >
        <DialogContent
          className={`${
            productEditForm.unitsEnabled && productEditForm.unitNumberingMode === "custom"
              ? "sm:max-w-4xl"
              : "sm:max-w-md"
          } bg-card border-border`}
        >
          <DialogHeader>
            <DialogTitle>Product Settings</DialogTitle>
            <DialogDescription>
              Update this product's details. Changes will be reflected in future exports.
            </DialogDescription>
          </DialogHeader>
          <ProductFormFields form={productEditForm} onChange={setProductEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={requestCloseProductEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveProductEdit} disabled={savingProductEdit}>
              {savingProductEdit ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productEditUnsavedDialogOpen} onOpenChange={setProductEditUnsavedDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unsaved product changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in Product Settings. Do you want to save before closing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductEditUnsavedDialogOpen(false)}>
              Continue editing
            </Button>
            <Button
              onClick={async () => {
                setProductEditUnsavedDialogOpen(false);
                await handleSaveProductEdit();
              }}
              disabled={savingProductEdit}
            >
              {savingProductEdit ? "Saving..." : "Save and close"}
            </Button>
            <Button variant="destructive" onClick={discardProductEditChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productEditValidationOpen} onOpenChange={setProductEditValidationOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Custom unit numbers are incomplete</DialogTitle>
            <DialogDescription>
              There {productEditValidationMissing === 1 ? "is" : "are"} {productEditValidationMissing} empty custom unit
              {productEditValidationMissing === 1 ? "" : "s"}. Fill all unit numbers before saving, or change unit settings
              back to Auto / disable multiple units.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setProductEditValidationOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionEditDialogOpen} onOpenChange={setSectionEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {sectionEditMode === "create" ? "Add Subchapter" : "Edit Subchapter"}
            </DialogTitle>
            <DialogDescription>
              Changes here apply only to this product's MDB.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Title</Label>
              <Input
                value={sectionDraft.title}
                onChange={(e) => setSectionDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Welding Data Sheet"
                className="bg-input/50"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Code</Label>
              <Input
                value={sectionDraft.code}
                onChange={(e) => setSectionDraft((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. WDS"
                className="bg-input/50 font-[var(--font-mono)]"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Description</Label>
              <Textarea
                value={sectionDraft.description}
                onChange={(e) => setSectionDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this subchapter contains"
                className="bg-input/50 min-h-28 resize-y"
              />
            </div>
            <DialogFooter className="pt-1">
              <Button variant="outline" onClick={() => setSectionEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSubchapterDialog}>
                {sectionEditMode === "create" ? "Add Subchapter" : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* Section Card in the library sidebar */
function SectionCard({
  section,
  onEdit,
  onAdd,
}: {
  section: LibrarySection;
  onEdit: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-accent/30 transition-colors overflow-hidden">
      <div
        className="w-1 h-5 rounded-full shrink-0"
        style={{ backgroundColor: section.categoryColor }}
      />
      <button
        onClick={onAdd}
        className="h-5 w-5 inline-flex items-center justify-center rounded border border-border text-primary hover:bg-primary/10 transition-colors shrink-0"
        title="Add section to MDB"
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        onClick={onEdit}
        className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent transition-colors shrink-0"
        title="Edit section"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-[var(--font-mono)] text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
            {section.code}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs font-medium truncate cursor-help">
                {section.title}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-xs">
              {section.description}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
