import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

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
        supplierName: true,
        supplierProjectNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ products });
  } catch {
    res.status(500).json({ error: "Failed to list products" });
  }
});

// Get a single product (includes mdbData)
router.get("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { userId: true, projectName: true, customerName: true } },
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
        supplierName: product.supplierName,
        supplierProjectNumber: product.supplierProjectNumber,
        mdbData: product.mdbData,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        projectName: product.project.projectName,
        projectCustomerName: product.project.customerName,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to get product" });
  }
});

// Create a product
router.post("/", async (req: AuthenticatedRequest, res) => {
  const { projectId, productName, tagNumber, mdbDocumentNumber, supplierName, supplierProjectNumber } = req.body as {
    projectId: string;
    productName: string;
    tagNumber: string;
    mdbDocumentNumber: string;
    supplierName?: string;
    supplierProjectNumber?: string;
  };

  if (!projectId || !productName || !tagNumber || !mdbDocumentNumber) {
    res.status(400).json({ error: "projectId, productName, tagNumber, and mdbDocumentNumber are required" });
    return;
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const product = await prisma.product.create({
      data: {
        projectId,
        productName,
        tagNumber,
        mdbDocumentNumber,
        supplierName: supplierName || null,
        supplierProjectNumber: supplierProjectNumber || null,
      },
      select: {
        id: true,
        projectId: true,
        productName: true,
        tagNumber: true,
        mdbDocumentNumber: true,
        supplierName: true,
        supplierProjectNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ product });
  } catch {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product metadata
router.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const { productName, tagNumber, mdbDocumentNumber, supplierName, supplierProjectNumber } = req.body as {
    productName?: string;
    tagNumber?: string;
    mdbDocumentNumber?: string;
    supplierName?: string | null;
    supplierProjectNumber?: string | null;
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

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(productName !== undefined && { productName }),
        ...(tagNumber !== undefined && { tagNumber }),
        ...(mdbDocumentNumber !== undefined && { mdbDocumentNumber }),
        ...(supplierName !== undefined && { supplierName }),
        ...(supplierProjectNumber !== undefined && { supplierProjectNumber }),
      },
      select: {
        id: true,
        projectId: true,
        productName: true,
        tagNumber: true,
        mdbDocumentNumber: true,
        supplierName: true,
        supplierProjectNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ product: updated });
  } catch {
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
  } catch {
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
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
