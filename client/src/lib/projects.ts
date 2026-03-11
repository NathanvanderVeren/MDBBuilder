import { supabase } from "./supabase";

export interface SavedProject {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
}

export interface SavedProjectWithData extends SavedProject {
  data: object;
}

export async function listProjects(): Promise<{ projects: SavedProject[]; error: string | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, updated_at, created_at")
    .order("updated_at", { ascending: false });

  return { projects: data ?? [], error: error?.message ?? null };
}

export async function saveProject(name: string, data: object, projectId?: string): Promise<{ id: string | null; error: string | null }> {
  if (projectId) {
    const { error } = await supabase
      .from("projects")
      .update({ name, data, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    return { id: projectId, error: error?.message ?? null };
  }

  const { data: row, error } = await supabase
    .from("projects")
    .insert({ name, data })
    .select("id")
    .single();

  return { id: row?.id ?? null, error: error?.message ?? null };
}

export async function loadProject(projectId: string): Promise<{ data: object | null; error: string | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select("data")
    .eq("id", projectId)
    .single();

  return { data: data?.data ?? null, error: error?.message ?? null };
}

export async function deleteProject(projectId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  return { error: error?.message ?? null };
}
