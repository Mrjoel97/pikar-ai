import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new location
 */
export const createLocation = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    code: v.string(),
    type: v.union(
      v.literal("headquarters"),
      v.literal("branch"),
      v.literal("warehouse"),
      v.literal("retail"),
      v.literal("office")
    ),
    parentLocationId: v.optional(v.id("locations")),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      country: v.string(),
      postalCode: v.string(),
    }),
    timezone: v.string(),
    manager: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const locationId = await ctx.db.insert("locations", {
      businessId: args.businessId,
      name: args.name,
      code: args.code,
      type: args.type,
      parentLocationId: args.parentLocationId,
      address: args.address,
      timezone: args.timezone,
      manager: args.manager,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "location_created",
      entityType: "location",
      entityId: locationId,
      details: { name: args.name, code: args.code, type: args.type },
      createdAt: Date.now(),
    });

    return locationId;
  },
});

/**
 * Get all locations for a business
 */
export const getLocations = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let locations = await ctx.db
      .query("locations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    if (!args.includeInactive) {
      locations = locations.filter((l) => l.isActive);
    }

    return locations.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get location hierarchy
 */
export const getLocationHierarchy = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    interface LocationNode {
      _id: string;
      name: string;
      code: string;
      type: string;
      parentLocationId?: string;
      children: LocationNode[];
    }

    const buildHierarchy = (parentId?: string): LocationNode[] => {
      return locations
        .filter((loc) => loc.parentLocationId === parentId)
        .map((location) => ({
          _id: location._id,
          name: location.name,
          code: location.code,
          type: location.type,
          parentLocationId: location.parentLocationId,
          children: buildHierarchy(location._id),
        }));
    };

    return buildHierarchy();
  },
});

/**
 * Update location
 */
export const updateLocation = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.optional(v.string()),
    manager: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    await ctx.db.patch(args.locationId, {
      ...args,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: location.businessId,
      action: "location_updated",
      entityType: "location",
      entityId: args.locationId,
      details: { changes: args },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete location
 */
export const deleteLocation = mutation({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    // Check for child locations
    const children = await ctx.db
      .query("locations")
      .withIndex("by_parent", (q) => q.eq("parentLocationId", args.locationId))
      .collect();

    if (children.length > 0) {
      throw new Error("Cannot delete location with child locations");
    }

    await ctx.db.patch(args.locationId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: location.businessId,
      action: "location_deleted",
      entityType: "location",
      entityId: args.locationId,
      details: { name: location.name },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});