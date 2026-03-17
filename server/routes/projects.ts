import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectNumber: true,
        projectName: true,
        customerName: true,
        customerProjectNumber: true,
        coverStyle: true,
        dividerStyle: true,
        fontFamily: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { products: true } },
      },
    });
    res.json({ projects });
  } catch (error) {
    console.error("Failed to list projects", error);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const {
    projectNumber,
    projectName,
    customerName,
    customerProjectNumber,
    coverStyle,
    dividerStyle,
    fontFamily,
  } = req.body as {
    projectNumber: string;
    projectName: string;
    customerName: string;
    customerProjectNumber?: string;
    coverStyle?: string;
    dividerStyle?: string;
    fontFamily?: string;
  };

  if (!projectNumber || !projectName || !customerName) {
    res.status(400).json({ error: "projectNumber, projectName, and customerName are required" });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId: req.userId!,
        projectNumber,
        projectName,
        customerName,
        customerProjectNumber: customerProjectNumber || null,
        ...(coverStyle !== undefined && { coverStyle }),
        ...(dividerStyle !== undefined && { dividerStyle }),
        ...(fontFamily !== undefined && { fontFamily }),
      },
      select: {
        id: true,
        projectNumber: true,
        projectName: true,
        customerName: true,
        customerProjectNumber: true,
        coverStyle: true,
        dividerStyle: true,
        fontFamily: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { products: true } },
      },
    });
    res.json({ project });
  } catch (error) {
    console.error("Failed to create project", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const {
    projectNumber,
    projectName,
    customerName,
    customerProjectNumber,
    coverStyle,
    dividerStyle,
    fontFamily,
  } = req.body as {
    projectNumber?: string;
    projectName?: string;
    customerName?: string;
    customerProjectNumber?: string | null;
    coverStyle?: string;
    dividerStyle?: string;
    fontFamily?: string;
  };

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project || project.userId !== req.userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(projectNumber !== undefined && { projectNumber }),
        ...(projectName !== undefined && { projectName }),
        ...(customerName !== undefined && { customerName }),
        ...(customerProjectNumber !== undefined && { customerProjectNumber }),
        ...(coverStyle !== undefined && { coverStyle }),
        ...(dividerStyle !== undefined && { dividerStyle }),
        ...(fontFamily !== undefined && { fontFamily }),
      },
      select: {
        id: true,
        projectNumber: true,
        projectName: true,
        customerName: true,
        customerProjectNumber: true,
        coverStyle: true,
        dividerStyle: true,
        fontFamily: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { products: true } },
      },
    });
    res.json({ project: updated });
  } catch (error) {
    console.error("Failed to update project", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project || project.userId !== req.userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
