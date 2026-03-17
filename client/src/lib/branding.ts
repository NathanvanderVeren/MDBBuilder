import { supabase } from "./supabase";

export interface BrandingSettings {
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  isFirstTime?: boolean;
  marketingConsent?: boolean;
}

const DEFAULT_BRANDING: BrandingSettings = {
  companyName: null,
  logoUrl: null,
  primaryColor: "#3B82F6",
  isFirstTime: false,
  marketingConsent: false,
};

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

export async function getBrandingSettings(): Promise<{
  branding: BrandingSettings;
  error: string | null;
}> {
  try {
    const res = await fetch("/api/branding", {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { branding: body.branding ?? DEFAULT_BRANDING, error: null };
  } catch (error) {
    return { branding: DEFAULT_BRANDING, error: String(error) };
  }
}

export async function saveBrandingSettings(data: BrandingSettings): Promise<{
  branding: BrandingSettings | null;
  error: string | null;
}> {
  try {
    const res = await fetch("/api/branding", {
      method: "PUT",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = await res.json();
    return { branding: body.branding ?? null, error: null };
  } catch (error) {
    return { branding: null, error: String(error) };
  }
}
