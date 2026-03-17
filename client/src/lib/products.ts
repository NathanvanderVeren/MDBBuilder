import { supabase } from "./supabase";
import type { ProjectDocumentStyle } from "./document-styles";

export type UnitNumberingMode =
  | "auto"
  | "auto-2"
  | "auto-3"
  | "auto-lower-alpha"
  | "auto-upper-alpha"
  | "custom";

export interface Product {
  id: string;
  projectId: string;
  productName: string;
  tagNumber: string | null;
  mdbDocumentNumber: string | null;
  unitsEnabled: boolean;
  unitCount: number;
  unitNumberingMode: UnitNumberingMode;
  unitNumberPrefix: string | null;
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
  unitNumberPrefix?: string | null;
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
    unitNumberPrefix: string | null;
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

function alphaSequence(index: number, uppercase: boolean): string {
  let value = "";
  let current = index;

  while (current > 0) {
    current -= 1;
    const charCode = (uppercase ? 65 : 97) + (current % 26);
    value = String.fromCharCode(charCode) + value;
    current = Math.floor(current / 26);
  }

  return value;
}

export function generateAutoUnitNumbers(
  count: number,
  mode: UnitNumberingMode,
  prefix?: string | null
): string[] {
  const safeCount = Math.max(1, Math.min(500, Number(count) || 1));
  const cleanPrefix = (prefix ?? "").trim();

  if (mode === "custom") {
    return [];
  }

  const numbers = Array.from({ length: safeCount }, (_, index) => {
    const unitIndex = index + 1;
    let sequence = String(unitIndex);

    if (mode === "auto-2") {
      sequence = String(unitIndex).padStart(2, "0");
    } else if (mode === "auto-3") {
      sequence = String(unitIndex).padStart(3, "0");
    } else if (mode === "auto-lower-alpha") {
      sequence = alphaSequence(unitIndex, false);
    } else if (mode === "auto-upper-alpha") {
      sequence = alphaSequence(unitIndex, true);
    }

    return `${cleanPrefix}${sequence}`;
  });

  return numbers;
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
