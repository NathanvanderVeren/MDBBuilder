import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  ALL_SECTIONS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DEFAULT_SECTION_CATEGORIES,
} from "../../client/src/lib/mdb-data.ts";

const router = Router();

type SeedCategory = { id: string; key: string };
type LibrarySectionRow = {
  id: string;
  key: string;
  categoryId: string;
  title: string;
  code: string;
  description: string;
  suggestedSections: Prisma.JsonValue | null;
  category: {
    key: string;
    name: string;
    color: string;
  };
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

async function uniqueCategoryKey(userId: string, base: string): Promise<string> {
  let key = slugify(base);
  let i = 2;

  while (true) {
    const existing = await prisma.libraryCategory.findUnique({
      where: { userId_key: { userId, key } },
      select: { id: true },
    });
    if (!existing) return key;
    key = `${slugify(base)}-${i}`;
    i += 1;
  }
}

async function uniqueSectionKey(userId: string, base: string): Promise<string> {
  let key = slugify(base);
  let i = 2;

  while (true) {
    const existing = await prisma.librarySection.findUnique({
      where: { userId_key: { userId, key } },
      select: { id: true },
    });
    if (!existing) return key;
    key = `${slugify(base)}-${i}`;
    i += 1;
  }
}

async function ensureLibrarySeeded(userId: string) {
  const categoryCount = await prisma.libraryCategory.count({ where: { userId } });
  if (categoryCount > 0) return;

  const categories = await Promise.all(
    DEFAULT_SECTION_CATEGORIES.map((categoryKey, index) =>
      prisma.libraryCategory.create({
        data: {
          userId,
          key: categoryKey,
          name: CATEGORY_LABELS[categoryKey] || categoryKey,
          color: CATEGORY_COLORS[categoryKey] || "#6B7280",
          sortOrder: index,
        },
      })
    )
  );

  const categoryIdByKey = new Map(categories.map((category: SeedCategory) => [category.key, category.id]));

  for (const section of ALL_SECTIONS) {
    if (section.id === "mdb-index") continue;

    const categoryId = categoryIdByKey.get(section.category);
    if (!categoryId) continue;

    await prisma.librarySection.create({
      data: {
        userId,
        key: section.id,
        categoryId,
        title: section.title,
        code: section.code,
        description: section.description,
        suggestedSections: section.suggestedSections ?? undefined,
      },
    });
  }
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    await ensureLibrarySeeded(userId);

    const [categories, sections] = await Promise.all([
      prisma.libraryCategory.findMany({
        where: { userId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          key: true,
          name: true,
          color: true,
          sortOrder: true,
        },
      }),
      prisma.librarySection.findMany({
        where: {
          userId,
          key: { not: "mdb-index" },
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          key: true,
          categoryId: true,
          title: true,
          code: true,
          description: true,
          suggestedSections: true,
          category: {
            select: { key: true, name: true, color: true },
          },
        },
      }),
    ]);

    res.json({
      categories,
      sections: (sections as LibrarySectionRow[]).map((section) => ({
        id: section.id,
        key: section.key,
        categoryId: section.categoryId,
        categoryKey: section.category.key,
        categoryName: section.category.name,
        categoryColor: section.category.color,
        title: section.title,
        code: section.code,
        description: section.description,
        suggestedSections: section.suggestedSections,
      })),
    });
  } catch (error) {
    console.error("Failed to load library", error);
    res.status(500).json({ error: "Failed to load library" });
  }
});

router.post("/categories", async (req: AuthenticatedRequest, res) => {
  const { name, color } = req.body as { name: string; color?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "Category name is required" });
    return;
  }

  try {
    const userId = req.userId!;
    const key = await uniqueCategoryKey(userId, name);
    const maxOrder = await prisma.libraryCategory.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });

    const category = await prisma.libraryCategory.create({
      data: {
        userId,
        key,
        name: name.trim(),
        color: color || "#6B7280",
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      select: { id: true, key: true, name: true, color: true, sortOrder: true },
    });

    res.json({ category });
  } catch (error) {
    console.error("Failed to create category", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/categories/:id", async (req: AuthenticatedRequest, res) => {
  const { name, color } = req.body as { name?: string; color?: string };

  try {
    const userId = req.userId!;
    const category = await prisma.libraryCategory.findUnique({ where: { id: req.params.id } });
    if (!category || category.userId !== userId) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const updated = await prisma.libraryCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
      },
      select: { id: true, key: true, name: true, color: true, sortOrder: true },
    });

    res.json({ category: updated });
  } catch (error) {
    console.error("Failed to update category", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const category = await prisma.libraryCategory.findUnique({ where: { id: req.params.id } });
    if (!category || category.userId !== userId) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const sectionCount = await prisma.librarySection.count({ where: { categoryId: category.id } });
    if (sectionCount > 0) {
      res.status(400).json({ error: "Cannot delete category with existing sections" });
      return;
    }

    await prisma.libraryCategory.delete({ where: { id: category.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

router.post("/sections", async (req: AuthenticatedRequest, res) => {
  const { categoryId, title, code, description, suggestedSections } = req.body as {
    categoryId: string;
    title: string;
    code: string;
    description: string;
    suggestedSections?: string[] | null;
  };

  if (!categoryId || !title?.trim() || !code?.trim() || !description?.trim()) {
    res.status(400).json({ error: "categoryId, title, code, and description are required" });
    return;
  }

  try {
    const userId = req.userId!;
    const category = await prisma.libraryCategory.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== userId) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const key = await uniqueSectionKey(userId, title);

    const section = await prisma.librarySection.create({
      data: {
        userId,
        key,
        categoryId,
        title: title.trim(),
        code: code.trim(),
        description: description.trim(),
        suggestedSections: suggestedSections ?? undefined,
      },
      select: {
        id: true,
        key: true,
        categoryId: true,
        title: true,
        code: true,
        description: true,
        suggestedSections: true,
      },
    });

    res.json({ section });
  } catch (error) {
    console.error("Failed to create section", error);
    res.status(500).json({ error: "Failed to create section" });
  }
});

router.patch("/sections/:id", async (req: AuthenticatedRequest, res) => {
  const { categoryId, title, code, description, suggestedSections } = req.body as {
    categoryId?: string;
    title?: string;
    code?: string;
    description?: string;
    suggestedSections?: string[] | null;
  };

  try {
    const userId = req.userId!;
    const section = await prisma.librarySection.findUnique({ where: { id: req.params.id } });
    if (!section || section.userId !== userId) {
      res.status(404).json({ error: "Section not found" });
      return;
    }

    if (categoryId) {
      const category = await prisma.libraryCategory.findUnique({ where: { id: categoryId } });
      if (!category || category.userId !== userId) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
    }

    const updateData: Prisma.LibrarySectionUncheckedUpdateInput = {};

    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (title !== undefined) updateData.title = title.trim();
    if (code !== undefined) updateData.code = code.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (suggestedSections !== undefined) {
      updateData.suggestedSections = suggestedSections ?? Prisma.DbNull;
    }

    const updated = await prisma.librarySection.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        key: true,
        categoryId: true,
        title: true,
        code: true,
        description: true,
        suggestedSections: true,
      },
    });

    res.json({ section: updated });
  } catch (error) {
    console.error("Failed to update section", error);
    res.status(500).json({ error: "Failed to update section" });
  }
});

router.delete("/sections/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const section = await prisma.librarySection.findUnique({ where: { id: req.params.id } });
    if (!section || section.userId !== userId) {
      res.status(404).json({ error: "Section not found" });
      return;
    }

    await prisma.librarySection.delete({ where: { id: section.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete section", error);
    res.status(500).json({ error: "Failed to delete section" });
  }
});

export default router;

