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
  Upload,
  FileDown,
  LogOut,
  ChevronLeft,
  Search,
  Lightbulb,
  AlertTriangle,
  Palette,
  LayoutTemplate,
  Save,
  FolderOpen,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { generatePdf } from "@/lib/pdf-generator";
import { listProjects, saveProject, loadProject, deleteProject, type SavedProject } from "@/lib/projects";

const LOGO_PNG =
  "https://d2xsxph8kpxj0f.cloudfront.net/109618846/j2CceLNvy3BzdkKcwBZVT6/BizzBit%20Logo%20large_88d9f1c2.png";

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

export default function Builder() {
  const { user, logout } = useAuth();
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
    addSection,
    removeSection,
    setLogoUrl,
    setPrimaryColor,
  } = useMdb();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SectionCategory | "all">("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [draggingChapter, setDraggingChapter] = useState<SectionCategory | null>(null);
  const [isChapterPointerDragging, setIsChapterPointerDragging] = useState(false);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [dragChapterPreviewTarget, setDragChapterPreviewTarget] = useState<string | null>(null);
  const [dragPreviewTarget, setDragPreviewTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  if (!user) {
    navigate("/");
    return null;
  }

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
    if (!state.chapterOrder.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, state.chapterOrder]);

  const filteredSections = useMemo(() => {
    return ALL_SECTIONS.filter((s) => {
      if (selectedIds.has(s.id)) return false;
      if (activeCategory !== "all" && s.category !== activeCategory) return false;
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
  }, [searchQuery, activeCategory, selectedIds]);

  // Completeness score
  const completenessScore = useMemo(() => {
    if (state.sections.length === 0) return 0;
    const hasIndex = state.sections.some((s) => s.id === "mdb-index");
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
    const hasLogo = !!state.logoUrl;
    const hasProjectName = !!state.info.projectName;

    const checks = [
      hasIndex,
      hasItp,
      hasMtc,
      hasWelding,
      hasNdt,
      hasTesting,
      hasDrawings,
      hasCerts,
      hasLogo,
      hasProjectName,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [state]);

  // Suggestions
  const suggestions = useMemo(() => {
    const tips: string[] = [];
    if (!state.sections.some((s) => s.id === "mdb-index"))
      tips.push("Add an MDB Index for a complete table of contents");
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
    if (!state.logoUrl) tips.push("Upload your company logo for branded output");
    return tips;
  }, [state]);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(reader.result as string);
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    },
    [setLogoUrl]
  );

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = SECTOR_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;
      const sections = template.sectionIds
        .map((id) => ALL_SECTIONS.find((s) => s.id === id))
        .filter(Boolean) as MdbSection[];
      setSections(sections);
      setTemplateDialogOpen(false);
      toast.success(`Template "${template.name}" applied`, {
        description: `${sections.filter((section) => section.id !== "mdb-index").length} chapters loaded`,
      });
    },
    [setSections]
  );

  const handleExportPdf = useCallback(async () => {
    if (state.sections.length === 0) {
      toast.error("Add at least one section before exporting");
      return;
    }
    setGenerating(true);
    try {
      await generatePdf(state);
      toast.success("PDF generated successfully!", {
        description: `${chapterCount} chapters with bookmarks`,
      });
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }, [state]);

  const categories = state.chapterOrder;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="h-4 w-4" />
            <img src={LOGO_PNG} alt="BizzBit" className="h-5" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <span className="text-sm font-[var(--font-mono)] text-muted-foreground">
            MDB Builder
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="gap-1.5 bg-transparent"
          >
            <Palette className="h-3.5 w-3.5" />
            Settings
          </Button>
          <Button
            size="sm"
            onClick={handleExportPdf}
            disabled={generating || state.sections.length === 0}
            className="gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            {generating ? "Generating..." : "Export PDF"}
          </Button>
          <div className="h-5 w-px bg-border ml-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Section Library */}
        {sidebarOpen && (
          <aside className="w-72 border-r border-border/50 bg-card/30 flex flex-col shrink-0">
            <div className="p-3 border-b border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Section Library</h3>
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
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      activeCategory === cat
                        ? "text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                    style={
                      activeCategory === cat
                        ? { backgroundColor: getChapterColor(cat) }
                        : undefined
                    }
                  >
                    {getChapterTitle(cat)}
                  </button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2 space-y-1">
                {filteredSections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onAdd={() => {
                      addSection(section);
                      toast.success(`Added: ${section.title}`);
                    }}
                  />
                ))}
                {filteredSections.length === 0 && (
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
              {/* Project Info */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Your MDB Structure</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Project Name
                    </Label>
                    <Input
                      placeholder="e.g. Shell Moerdijk — V-4501"
                      value={state.info.projectName}
                      onChange={(e) => setInfo({ projectName: e.target.value })}
                      className="bg-input/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Client Name
                    </Label>
                    <Input
                      placeholder="e.g. Shell Nederland"
                      value={state.info.clientName}
                      onChange={(e) => setInfo({ clientName: e.target.value })}
                      className="bg-input/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Document Number
                    </Label>
                    <Input
                      value={state.info.documentNumber}
                      onChange={(e) =>
                        setInfo({ documentNumber: e.target.value })
                      }
                      className="bg-input/50 font-[var(--font-mono)] text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Revision
                      </Label>
                      <Input
                        value={state.info.revision}
                        onChange={(e) => setInfo({ revision: e.target.value })}
                        className="bg-input/50 font-[var(--font-mono)] text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Date
                      </Label>
                      <Input
                        type="date"
                        value={state.info.date}
                        onChange={(e) => setInfo({ date: e.target.value })}
                        className="bg-input/50 font-[var(--font-mono)] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSidebarOpen(true)}
                        className="gap-1.5 bg-transparent"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Browse Sections
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
                        <div key={category} className="space-y-1.5">
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
                              className="flex items-center gap-2 px-3 py-2 border-b border-border/50"
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
                                  addCustomSubchapter(category);
                                  toast.success(`Added subchapter to ${getChapterTitle(category)}`);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Subchapter
                              </Button>
                              {category !== "general" && (
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
                              )}
                            </div>

                            {!isChapterDragMode && (
                              <div className="p-2 space-y-1.5">
                                {chapterSections.length === 0 ? (
                                  <div className="text-xs text-muted-foreground px-2 py-3 border border-dashed border-border rounded-md">
                                    Drop subchapters here
                                  </div>
                                ) : (
                                  chapterSections.map((section, subIndex) => (
                                    <div key={section.id} className="space-y-1.5">
                                      <div
                                        className="h-2 rounded bg-transparent"
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
                                        className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-border group"
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
                                            <Input
                                              value={section.title}
                                              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                              className="h-7 px-2 py-0 text-sm bg-input/40 border-border/40"
                                            />
                                          </div>
                                        </div>
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
                                    </div>
                                  ))
                                )}

                                <div
                                  className="h-2 rounded bg-transparent"
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
                        </div>
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

          {/* Logo & Branding */}
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold mb-3">Branding</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Company Logo
                </Label>
                {state.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={state.logoUrl}
                      alt="Logo"
                      className="h-12 object-contain bg-white rounded p-1"
                    />
                    <button
                      onClick={() => setLogoUrl(null)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-16 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Primary Color
                </Label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`h-7 w-7 rounded-md border-2 transition-all ${
                        state.primaryColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mini Preview */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold mb-3">Document Preview</h3>
            <div className="bg-white rounded-lg p-3 text-black text-[8px] leading-tight shadow-lg aspect-[3/4] overflow-hidden">
              {/* Mini cover page */}
              <div
                className="h-1.5 rounded-sm mb-2"
                style={{ backgroundColor: state.primaryColor }}
              />
              {state.logoUrl && (
                <img
                  src={state.logoUrl}
                  alt=""
                  className="h-4 object-contain mb-1"
                />
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
              {state.sections.slice(0, 12).map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 mb-0.5">
                  <span className="text-gray-400">{i + 1}.</span>
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
              {state.sections.length > 12 && (
                <div className="text-gray-400 mt-0.5">
                  +{state.sections.length - 12} more...
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
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
                onClick={() => handleApplyTemplate(t.id)}
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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Configure your MDB document settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Project Name</Label>
              <Input
                value={state.info.projectName}
                onChange={(e) => setInfo({ projectName: e.target.value })}
                placeholder="Enter project name"
                className="bg-input/50"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Document Number</Label>
              <Input
                value={state.info.documentNumber}
                onChange={(e) => setInfo({ documentNumber: e.target.value })}
                className="bg-input/50 font-[var(--font-mono)]"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm mb-1.5 block">Revision</Label>
                <Input
                  value={state.info.revision}
                  onChange={(e) => setInfo({ revision: e.target.value })}
                  className="bg-input/50 font-[var(--font-mono)]"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm mb-1.5 block">Date</Label>
                <Input
                  type="date"
                  value={state.info.date}
                  onChange={(e) => setInfo({ date: e.target.value })}
                  className="bg-input/50 font-[var(--font-mono)]"
                />
              </div>
            </div>
            <Button onClick={() => setSettingsOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Section Card in the library sidebar */
function SectionCard({
  section,
  onAdd,
}: {
  section: MdbSection;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors group">
      <div
        className="w-1 h-6 rounded-full shrink-0"
        style={{ backgroundColor: CATEGORY_COLORS[section.category] }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-[var(--font-mono)] text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
            {section.code}
          </span>
          <span className="text-xs font-medium truncate">{section.title}</span>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          {section.description}
        </TooltipContent>
      </Tooltip>
      <button
        onClick={onAdd}
        className="p-1 text-muted-foreground/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
