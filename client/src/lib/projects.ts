import { supabase } from "./supabase";
import type { ProjectDocumentStyle } from "./document-styles";

export interface Project extends ProjectDocumentStyle {
  id: string;
  projectNumber: string;
  projectName: string;
  customerName: string;
  customerProjectNumber: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function listProjects(): Promise<{
  projects: Project[];
  error: string | null;
}> {
  try {
    const res = await fetch("/api/projects", { headers: await authHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { projects: body.projects ?? [], error: null };
  } catch (e) {
    return { projects: [], error: String(e) };
  }
}

export async function createProject(data: {
  projectNumber: string;
  projectName: string;
  customerName: string;
  customerProjectNumber?: string;
  coverStyle?: ProjectDocumentStyle["coverStyle"];
  dividerStyle?: ProjectDocumentStyle["dividerStyle"];
  fontFamily?: ProjectDocumentStyle["fontFamily"];
}): Promise<{ project: Project | null; error: string | null }> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { project: body.project ?? null, error: null };
  } catch (e) {
    return { project: null, error: String(e) };
  }
}

export async function updateProject(
  id: string,
  data: Partial<{
    projectNumber: string;
    projectName: string;
    customerName: string;
    customerProjectNumber: string | null;
    coverStyle: ProjectDocumentStyle["coverStyle"];
    dividerStyle: ProjectDocumentStyle["dividerStyle"];
    fontFamily: ProjectDocumentStyle["fontFamily"];
  }>
): Promise<{ project: Project | null; error: string | null }> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { project: body.project ?? null, error: null };
  } catch (e) {
    return { project: null, error: String(e) };
  }
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}
