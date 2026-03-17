import { supabase } from "./supabase";

export type LibraryCategory = {
  id: string;
  key: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type LibrarySection = {
  id: string;
  key: string;
  categoryId: string;
  categoryKey: string;
  categoryName: string;
  categoryColor: string;
  title: string;
  code: string;
  description: string;
  suggestedSections: string[] | null;
};

export type LibraryPayload = {
  categories: LibraryCategory[];
  sections: LibrarySection[];
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authHeader = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const requestHeaders = new Headers(init?.headers);
  requestHeaders.set("Content-Type", "application/json");
  if (authHeader.Authorization) {
    requestHeaders.set("Authorization", authHeader.Authorization);
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Library request failed");
  }
  return body as T;
}

export async function getLibrary(): Promise<LibraryPayload> {
  return request<LibraryPayload>("/api/library");
}

export async function createLibraryCategory(input: {
  name: string;
  color?: string;
}): Promise<LibraryCategory> {
  const data = await request<{ category: LibraryCategory }>("/api/library/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.category;
}

export async function updateLibraryCategory(
  id: string,
  input: { name?: string; color?: string }
): Promise<LibraryCategory> {
  const data = await request<{ category: LibraryCategory }>(`/api/library/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.category;
}

export async function createLibrarySection(input: {
  categoryId: string;
  title: string;
  code: string;
  description: string;
  suggestedSections?: string[] | null;
}): Promise<LibrarySection> {
  const data = await request<{ section: LibrarySection }>("/api/library/sections", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.section;
}

export async function updateLibrarySection(
  id: string,
  input: {
    categoryId?: string;
    title?: string;
    code?: string;
    description?: string;
    suggestedSections?: string[] | null;
  }
): Promise<LibrarySection> {
  const data = await request<{ section: LibrarySection }>(`/api/library/sections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.section;
}
