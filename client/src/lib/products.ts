import { supabase } from "./supabase";
import type { ProjectDocumentStyle } from "./document-styles";

export type UnitNumberingMode = "auto" | "custom";

export interface Product {
  id: string;
  projectId: string;
  productName: string;
  tagNumber: string | null;
  mdbDocumentNumber: string | null;
  unitsEnabled: boolean;
  unitCount: number;
  unitNumberingMode: UnitNumberingMode;
  customUnitNumbers: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithMdb extends Product {
  mdbData: object | null;
  projectNumber: string;
  projectName: string;
  projectCustomerName: string;
  projectCustomerProjectNumber: string | null;
  coverStyle: ProjectDocumentStyle["coverStyle"];
  dividerStyle: ProjectDocumentStyle["dividerStyle"];
  fontFamily: ProjectDocumentStyle["fontFamily"];
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

export async function listProducts(projectId: string): Promise<{
  products: Product[];
  error: string | null;
}> {
  try {
    const res = await fetch(`/api/products/project/${projectId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { products: body.products ?? [], error: null };
  } catch (e) {
    return { products: [], error: String(e) };
  }
}

export async function getProduct(id: string): Promise<{
  product: ProductWithMdb | null;
  error: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`/api/products/${id}`, {
      headers: await authHeaders(),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { product: body.product ?? null, error: null };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { product: null, error: "Request timed out while loading product" };
    }
    return { product: null, error: String(e) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createProduct(data: {
  projectId: string;
  productName: string;
  tagNumber?: string | null;
  mdbDocumentNumber?: string | null;
  unitsEnabled?: boolean;
  unitCount?: number;
  unitNumberingMode?: UnitNumberingMode;
  customUnitNumbers?: string[] | null;
}): Promise<{ product: Product | null; error: string | null }> {
  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { product: body.product ?? null, error: null };
  } catch (e) {
    return { product: null, error: String(e) };
  }
}

export async function updateProduct(
  id: string,
  data: Partial<{
    productName: string;
    tagNumber: string | null;
    mdbDocumentNumber: string | null;
    unitsEnabled: boolean;
    unitCount: number;
    unitNumberingMode: UnitNumberingMode;
    customUnitNumbers: string[] | null;
  }>
): Promise<{ product: Product | null; error: string | null }> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { product: body.product ?? null, error: null };
  } catch (e) {
    return { product: null, error: String(e) };
  }
}

export async function saveMdbData(
  productId: string,
  mdbData: object
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/products/${productId}/mdb`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ mdbData }),
    });
    if (!res.ok) throw new Error(await res.text());
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}
