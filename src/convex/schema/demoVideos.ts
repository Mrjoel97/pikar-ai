import { defineTable } from "convex/server";
import { v } from "convex/values";

export const demoVideos = defineTable({
  title: v.string(),
  description: v.string(),
  url: v.string(),
  thumbnail: v.string(),
  duration: v.string(),
  tier: v.string(),
  featured: v.boolean(),
}).index("by_featured", ["featured"]);