import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId! },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ projects });
  } catch {
    res.status(500).json({ error: "Failed to list projects" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const { name, data, projectId } = req.body as {
    name: string;
    data: object;
    projectId?: string;
  };

  if (!name || !data) {
    res.status(400).json({ error: "name and data are required" });
    return;
  }

  try {
    if (projectId) {
      const existing = await prisma.project.findUnique({ where: { id: projectId } });
      if (!existing || existing.userId !== req.userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      await prisma.project.update({
        where: { id: projectId },
        data: { name, data, updatedAt: new Date() },
      });
      res.json({ id: projectId });
      return;
    }

    const project = await prisma.project.create({
      data: { userId: req.userId!, name, data },
      select: { id: true },
    });
    res.json({ id: project.id });
  } catch {
    res.status(500).json({ error: "Failed to save project" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    if (!project || project.userId !== req.userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({ data: project.data });
  } catch {
    res.status(500).json({ error: "Failed to load project" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    if (!project || project.userId !== req.userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
