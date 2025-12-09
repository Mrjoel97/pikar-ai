import { defineTable } from "convex/server";
import { v } from "convex/values";

export const whiteLabelSchema = {
  whiteLabelBranding: defineTable({
    businessId: v.id("businesses"),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    brandName: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    customCss: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  whiteLabelDomains: defineTable({
    businessId: v.id("businesses"),
    domain: v.string(),
    isPrimary: v.boolean(),
    verified: v.boolean(),
    verificationToken: v.string(),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  whiteLabelThemes: defineTable({
    businessId: v.id("businesses"),
    themeName: v.optional(v.string()),
    colors: v.optional(v.object({
      background: v.string(),
      foreground: v.string(),
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      muted: v.string(),
      border: v.string(),
    })),
    typography: v.optional(v.object({
      fontFamily: v.string(),
      headingFont: v.optional(v.string()),
      fontSize: v.optional(v.string()),
    })),
    layout: v.optional(v.object({
      borderRadius: v.string(),
      spacing: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),
};
