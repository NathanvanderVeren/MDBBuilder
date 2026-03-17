import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

type UnitNumberingMode =
  | "auto"
  | "auto-2"
  | "auto-3"
  | "auto-lower-alpha"
  | "auto-upper-alpha"
  | "custom";

function normalizeUnitNumberingMode(value: unknown): UnitNumberingMode {
  if (
    value === "auto" ||
    value === "auto-2" ||
    value === "auto-3" ||
    value === "auto-lower-alpha" ||
    value === "auto-upper-alpha" ||
    value === "custom"
  ) {
    return value;
  }

  return "auto";
}

function normalizeUnitSettings(input: {
  unitsEnabled?: unknown;
  unitCount?: unknown;
  unitNumberingMode?: unknown;
  unitNumberPrefix?: unknown;
  customUnitNumbers?: unknown;
}) {
  const unitsEnabled = input.unitsEnabled === true;
  const parsedCount = Number(input.unitCount);
  const unitCount = Number.isFinite(parsedCount)
    ? Math.max(1, Math.min(500, Math.floor(parsedCount)))
    : 1;
  const unitNumberingMode = normalizeUnitNumberingMode(input.unitNumberingMode);
  const rawPrefix =
    typeof input.unitNumberPrefix === "string" ? input.unitNumberPrefix.trim() : "";
  const unitNumberPrefix = rawPrefix ? rawPrefix.slice(0, 32) : null;

  if (!unitsEnabled) {
    return {
      unitsEnabled: false,
      unitCount: 1,
      unitNumberingMode: "auto" as UnitNumberingMode,
      unitNumberPrefix: null,
      customUnitNumbers: Prisma.DbNull,
    };
  }

  if (unitNumberingMode === "custom") {
    const values = Array.isArray(input.customUnitNumbers)
      ? input.customUnitNumbers.map((value) => String(value ?? "").trim()).filter(Boolean)
      : [];

    if (values.length !== unitCount) {
      return { error: "For custom numbering, provide exactly one unit number per unit." } as const;
    }

    return {
      unitsEnabled: true,
      unitCount,
      unitNumberingMode,
      unitNumberPrefix: null,
      customUnitNumbers: values,
    };
  }

  return {
    unitsEnabled: true,
    unitCount,
    unitNumberingMode,
    unitNumberPrefix,
    customUnitNumbers: Prisma.DbNull,
  };
}

// List products for a project
router.get("/project/:projectId", async (req: AuthenticatedRequest, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project || project.userId !== req.userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const products = await prisma.product.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectId: true,
        productName: true,
        tagNumber: true,
        mdbDocumentNumber: true,
        unitsEnabled: true,
        unitCount: true,
        unitNumberingMode: true,
        unitNumberPrefix: true,
        customUnitNumbers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ products });
  } catch (error) {
    console.error("Failed to list products", error);
    res.status(500).json({ error: "Failed to list products" });
  }
});

// Get a single product (includes mdbData)
router.get("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: {
            userId: true,
            projectNumber: true,
            projectName: true,
            customerName: true,
            customerProjectNumber: true,
            coverStyle: true,
            dividerStyle: true,
            fontFamily: true,
          },
        },
      },
    });

    if (!product || product.project.userId !== req.userId) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      product: {
        id: product.id,
        projectId: product.projectId,
        productName: product.productName,
        tagNumber: product.tagNumber,
        mdbDocumentNumber: product.mdbDocumentNumber,
        unitsEnabled: product.unitsEnabled,
        unitCount: product.unitCount,
        unitNumberingMode: product.unitNumberingMode,
        unitNumberPrefix: product.unitNumberPrefix,
        customUnitNumbers: product.customUnitNumbers,
        mdbData: product.mdbData,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        projectNumber: product.project.projectNumber,
        projectName: product.project.projectName,
        projectCustomerName: product.project.customerName,
        projectCustomerProjectNumber: product.project.customerProjectNumber,
        coverStyle: product.project.coverStyle,
        dividerStyle: product.project.dividerStyle,
        fontFamily: product.project.fontFamily,
      },
    });
  } catch (error) {
    console.error("Failed to get product", error);
    res.status(500).json({ error: "Failed to get product" });
  }
});

// Create a product
router.post("/", async (req: AuthenticatedRequest, res) => {
  const {
    projectId,
    productName,
    tagNumber,
    mdbDocumentNumber,
    unitsEnabled,
    unitCount,
    unitNumberingMode,
    unitNumberPrefix,
    customUnitNumbers,
  } = req.body as {
    projectId: string;
    productName: string;
    tagNumber?: string | null;
    mdbDocumentNumber?: string | null;
    unitsEnabled?: boolean;
    unitCount?: number;
    unitNumberingMode?: UnitNumberingMode;
    unitNumberPrefix?: string | null;
    customUnitNumbers?: string[];
  };

  if (!projectId || !productName?.trim()) {
    res.status(400).json({ error: "projectId and productName are required" });
    return;
  }

  try {
    const normalizedUnits = normalizeUnitSettings({
      unitsEnabled,
      unitCount,
      unitNumberingMode,
      unitNumberPrefix,
      customUnitNumbers,
    });
    if ("error" in normalizedUnits) {
      res.status(400).json({ error: normalizedUnits.error });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const product = await prisma.product.create({
      data: {
        projectId,
        productName: productName.trim(),
        tagNumber: tagNumber?.trim() || null,
        mdbDocumentNumber: mdbDocumentNumber?.trim() || null,
        unitsEnabled: normalizedUnits.unitsEnabled,
        unitCount: normalizedUnits.unitCount,
        unitNumberingMode: normalizedUnits.unitNumberingMode,
        unitNumberPrefix: normalizedUnits.unitNumberPrefix,
        customUnitNumbers: normalizedUnits.customUnitNumbers,
      },
      select: {
        id: true,
        projectId: true,
        productName: true,
        tagNumber: true,
        mdbDocumentNumber: true,
        unitsEnabled: true,
        unitCount: true,
        unitNumberingMode: true,
        unitNumberPrefix: true,
        customUnitNumbers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ product });
  } catch (error) {
    console.error("Failed to create product", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product metadata
router.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const {
    productName,
    tagNumber,
    mdbDocumentNumber,
    unitsEnabled,
    unitCount,
    unitNumberingMode,
    unitNumberPrefix,
    customUnitNumbers,
  } = req.body as {
    productName?: string;
    tagNumber?: string | null;
    mdbDocumentNumber?: string | null;
    unitsEnabled?: boolean;
    unitCount?: number;
    unitNumberingMode?: UnitNumberingMode;
    unitNumberPrefix?: string | null;
    customUnitNumbers?: string[];
  };

  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!product || product.project.userId !== req.userId) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const hasUnitsUpdate =
      unitsEnabled !== undefined ||
      unitCount !== undefined ||
      unitNumberingMode !== undefined ||
      unitNumberPrefix !== undefined ||
      customUnitNumbers !== undefined;
    const normalizedUnits = hasUnitsUpdate
      ? normalizeUnitSettings({
          unitsEnabled: unitsEnabled ?? product.unitsEnabled,
          unitCount: unitCount ?? product.unitCount,
          unitNumberingMode: unitNumberingMode ?? product.unitNumberingMode,
          unitNumberPrefix: unitNumberPrefix ?? product.unitNumberPrefix,
          customUnitNumbers: customUnitNumbers ?? product.customUnitNumbers,
        })
      : null;

    if (normalizedUnits && "error" in normalizedUnits) {
      res.status(400).json({ error: normalizedUnits.error });
      return;
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(productName !== undefined && { productName: productName.trim() }),
        ...(tagNumber !== undefined && { tagNumber: tagNumber?.trim() || null }),
        ...(mdbDocumentNumber !== undefined && { mdbDocumentNumber: mdbDocumentNumber?.trim() || null }),
        ...(normalizedUnits && {
          unitsEnabled: normalizedUnits.unitsEnabled,
          unitCount: normalizedUnits.unitCount,
          unitNumberingMode: normalizedUnits.unitNumberingMode,
          unitNumberPrefix: normalizedUnits.unitNumberPrefix,
          customUnitNumbers: normalizedUnits.customUnitNumbers,
        }),
      },
      select: {
        id: true,
        projectId: true,
        productName: true,
        tagNumber: true,
        mdbDocumentNumber: true,
        unitsEnabled: true,
        unitCount: true,
        unitNumberingMode: true,
        unitNumberPrefix: true,
        customUnitNumbers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ product: updated });
  } catch (error) {
    console.error("Failed to update product", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Save MDB data for a product
router.patch("/:id/mdb", async (req: AuthenticatedRequest, res) => {
  const { mdbData } = req.body as { mdbData: object };

  if (!mdbData) {
    res.status(400).json({ error: "mdbData is required" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!product || product.project.userId !== req.userId) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { mdbData },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save MDB data", error);
    res.status(500).json({ error: "Failed to save MDB data" });
  }
});

// Delete a product
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!product || product.project.userId !== req.userId) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
