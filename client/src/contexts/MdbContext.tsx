import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  ALL_SECTIONS,
  DEFAULT_SECTION_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type MdbSection,
  type ProjectInfo,
  type SectionCategory,
} from "@/lib/mdb-data";

interface MdbState {
  info: ProjectInfo;
  sections: MdbSection[];
  chapterOrder: SectionCategory[];
  chapterMeta: Record<SectionCategory, { title: string; color: string }>;
  logoUrl: string | null;
  primaryColor: string;
}

interface MdbContextType {
  state: MdbState;
  setInfo: (info: Partial<ProjectInfo>) => void;
  setSections: (sections: MdbSection[]) => void;
  setChapterOrder: (chapterOrder: SectionCategory[]) => void;
  addChapter: (title?: string) => SectionCategory;
  removeChapter: (chapterId: SectionCategory) => void;
  updateChapterTitle: (chapterId: SectionCategory, title: string) => void;
  updateChapterColor: (chapterId: SectionCategory, color: string) => void;
  addCustomSubchapter: (chapterId: SectionCategory, title?: string) => void;
  addSection: (section: MdbSection) => void;
  removeSection: (id: string) => void;
  reorderSections: (from: number, to: number) => void;
  updateSectionTitle: (id: string, title: string) => void;
  updateSectionCode: (id: string, code: string) => void;
  updateSectionDescription: (id: string, description: string) => void;
  setLogoUrl: (url: string | null) => void;
  setPrimaryColor: (color: string) => void;
  resetProject: () => void;
  loadState: (savedState: MdbState) => void;
}

const defaultInfo: ProjectInfo = {
  projectName: "",
  documentNumber: "MDB-2026-001",
  revision: "A",
  clientName: "",
  date: new Date().toISOString().split("T")[0],
};

const CHAPTER_COLOR_ROTATION = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#F97316",
];

const defaultState: MdbState = {
  info: defaultInfo,
  sections: [],
  chapterOrder: [],
  chapterMeta: Object.fromEntries(
    DEFAULT_SECTION_CATEGORIES.map((category) => [
      category,
      {
        title: CATEGORY_LABELS[category] || category,
        color: CATEGORY_COLORS[category] || "#6B7280",
      },
    ])
  ),
  logoUrl: null,
  primaryColor: "#3B82F6",
};

const INDEX_SECTION = ALL_SECTIONS.find((section) => section.id === "mdb-index") as MdbSection;

function normalizeSections(
  sections: MdbSection[],
  chapterOrder: SectionCategory[]
): MdbSection[] {
  const indexSection = sections.find((section) => section.id === "mdb-index");
  const nonIndexSections = sections.filter((section) => section.id !== "mdb-index");
  const shouldIncludeIndex = chapterOrder.length > 0 || nonIndexSections.length > 0;

  const orderedSections = chapterOrder.flatMap((category) =>
    nonIndexSections.filter((section) => section.category === category)
  );

  const leftoverSections = nonIndexSections.filter(
    (section) => !chapterOrder.includes(section.category)
  );

  const normalized = [...orderedSections, ...leftoverSections];
  if (!shouldIncludeIndex) return normalized;

  return [
    indexSection || INDEX_SECTION,
    ...normalized,
  ];
}

const MdbContext = createContext<MdbContextType | null>(null);

export function MdbProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MdbState>(defaultState);

  const setInfo = useCallback((info: Partial<ProjectInfo>) => {
    setState((prev) => ({ ...prev, info: { ...prev.info, ...info } }));
  }, []);

  const setSections = useCallback((sections: MdbSection[]) => {
    setState((prev) => ({
      ...prev,
      sections: normalizeSections(sections, prev.chapterOrder),
    }));
  }, []);

  const setChapterOrder = useCallback((chapterOrder: SectionCategory[]) => {
    setState((prev) => ({
      ...prev,
      chapterOrder,
      sections: normalizeSections(prev.sections, chapterOrder),
    }));
  }, []);

  const addChapter = useCallback((title?: string) => {
    const chapterId = `chapter-${Date.now().toString(36)}`;
    setState((prev) => ({
      ...prev,
      sections: normalizeSections(prev.sections, [...prev.chapterOrder, chapterId]),
      chapterOrder: [...prev.chapterOrder, chapterId],
      chapterMeta: {
        ...prev.chapterMeta,
        [chapterId]: {
          title: title?.trim() || "New Main Chapter",
          color:
            CHAPTER_COLOR_ROTATION[
              prev.chapterOrder.length % CHAPTER_COLOR_ROTATION.length
            ],
        },
      },
    }));
    return chapterId;
  }, []);

  const removeChapter = useCallback((chapterId: SectionCategory) => {
    setState((prev) => {
      const nextChapterOrder = prev.chapterOrder.filter((id) => id !== chapterId);
      const nextChapterMeta = { ...prev.chapterMeta };
      delete nextChapterMeta[chapterId];

      const nextSections = prev.sections.filter(
        (section) => section.category !== chapterId
      );

      return {
        ...prev,
        chapterOrder: nextChapterOrder,
        chapterMeta: nextChapterMeta,
        sections: normalizeSections(nextSections, nextChapterOrder),
      };
    });
  }, []);

  const updateChapterTitle = useCallback((chapterId: SectionCategory, title: string) => {
    setState((prev) => ({
      ...prev,
      chapterMeta: {
        ...prev.chapterMeta,
        [chapterId]: {
          ...(prev.chapterMeta[chapterId] || {
            title: chapterId,
            color: "#6B7280",
          }),
          title,
        },
      },
    }));
  }, []);

  const updateChapterColor = useCallback((chapterId: SectionCategory, color: string) => {
    setState((prev) => ({
      ...prev,
      chapterMeta: {
        ...prev.chapterMeta,
        [chapterId]: {
          ...(prev.chapterMeta[chapterId] || {
            title: chapterId,
            color: "#6B7280",
          }),
          color,
        },
      },
    }));
  }, []);

  const addCustomSubchapter = useCallback(
    (chapterId: SectionCategory, title?: string) => {
      const subchapter: MdbSection = {
        id: `sub-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        title: title?.trim() || "New Subchapter",
        code: "CUS",
        category: chapterId,
        description: "Custom subchapter",
      };

      setState((prev) => ({
        ...prev,
        sections: normalizeSections([...prev.sections, subchapter], prev.chapterOrder),
      }));
    },
    []
  );

  const addSection = useCallback((section: MdbSection) => {
    setState((prev) => {
      if (prev.sections.find((s) => s.id === section.id)) return prev;
      return {
        ...prev,
        sections: normalizeSections([...prev.sections, section], prev.chapterOrder),
      };
    });
  }, []);

  const removeSection = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sections: normalizeSections(
        prev.sections.filter((s) => s.id !== id),
        prev.chapterOrder
      ),
    }));
  }, []);

  const reorderSections = useCallback((from: number, to: number) => {
    setState((prev) => {
      const arr = [...prev.sections];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return {
        ...prev,
        sections: normalizeSections(arr, prev.chapterOrder),
      };
    });
  }, []);

  const updateSectionTitle = useCallback((id: string, title: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, title } : s)),
    }));
  }, []);

  const updateSectionCode = useCallback((id: string, code: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, code } : s)),
    }));
  }, []);

  const updateSectionDescription = useCallback((id: string, description: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, description } : s)),
    }));
  }, []);

  const setLogoUrl = useCallback((url: string | null) => {
    setState((prev) => ({ ...prev, logoUrl: url }));
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, primaryColor: color }));
  }, []);

  const resetProject = useCallback(() => {
    setState(defaultState);
  }, []);

  const loadState = useCallback((savedState: MdbState) => {
    setState({
      ...savedState,
      sections: normalizeSections(savedState.sections, savedState.chapterOrder),
    });
  }, []);

  return (
    <MdbContext.Provider
      value={{
        state,
        setInfo,
        setSections,
        setChapterOrder,
        addChapter,
        removeChapter,
        updateChapterTitle,
        updateChapterColor,
        addCustomSubchapter,
        addSection,
        removeSection,
        reorderSections,
        updateSectionTitle,
        updateSectionCode,
        updateSectionDescription,
        setLogoUrl,
        setPrimaryColor,
        resetProject,
        loadState,
      }}
    >
      {children}
    </MdbContext.Provider>
  );
}

export function useMdb() {
  const ctx = useContext(MdbContext);
  if (!ctx) throw new Error("useMdb must be used within MdbProvider");
  return ctx;
}
