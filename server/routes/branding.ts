import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const DEFAULT_PRIMARY_COLOR = "#3B82F6";

router.get("/", async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const settings = await prisma.userBrandingSettings.findUnique({
      where: { userId: req.userId },
      select: {
        companyName: true,
        logoUrl: true,
        primaryColor: true,
        marketingConsent: true,
      },
    });

    res.json({
      branding: {
        companyName: settings?.companyName ?? null,
        logoUrl: settings?.logoUrl ?? null,
        primaryColor: settings?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        marketingConsent: settings?.marketingConsent ?? false,
        isFirstTime: !settings,
      },
    });
  } catch (error) {
    console.error("Failed to load branding settings", error);
    res.status(500).json({ error: "Failed to load branding settings" });
  }
});

router.put("/", async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { companyName, logoUrl, primaryColor, marketingConsent } = req.body as {
    companyName?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    marketingConsent?: boolean;
  };

  const normalizedCompanyName = companyName?.trim() || null;
  const normalizedLogoUrl = logoUrl?.trim() || null;
  const normalizedPrimaryColor = primaryColor?.trim() || DEFAULT_PRIMARY_COLOR;
  const normalizedMarketingConsent = marketingConsent === true;
  const includeMarketingConsent = typeof marketingConsent === "boolean";

  try {
    const settings = await prisma.userBrandingSettings.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        companyName: normalizedCompanyName,
        logoUrl: normalizedLogoUrl,
        primaryColor: normalizedPrimaryColor,
        marketingConsent: normalizedMarketingConsent,
      },
      update: {
        companyName: normalizedCompanyName,
        logoUrl: normalizedLogoUrl,
        primaryColor: normalizedPrimaryColor,
        ...(includeMarketingConsent ? { marketingConsent: normalizedMarketingConsent } : {}),
      },
      select: {
        companyName: true,
        logoUrl: true,
        primaryColor: true,
        marketingConsent: true,
      },
    });

    res.json({
      branding: {
        ...settings,
        isFirstTime: false,
      },
    });
  } catch (error) {
    console.error("Failed to save branding settings", error);
    res.status(500).json({ error: "Failed to save branding settings" });
  }
});

export default router;
