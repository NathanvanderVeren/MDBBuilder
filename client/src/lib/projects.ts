import { supabase } from "./supabase";

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
}

export interface SavedProjectWithData extends SavedProject {
  data: object;
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
  projects: SavedProject[];
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

export async function saveProject(
  name: string,
  data: object,
  projectId?: string
): Promise<{ id: string | null; error: string | null }> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ name, data, projectId }),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { id: body.id ?? null, error: null };
  } catch (e) {
    return { id: null, error: String(e) };
  }
}

export async function loadProject(
  projectId: string
): Promise<{ data: object | null; error: string | null }> {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { data: body.data ?? null, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

export async function deleteProject(
  projectId: string
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}
