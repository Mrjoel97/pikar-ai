// ... keep existing code (imports and other exports)

export const adminListPlaybookVersions = query({
  // Make playbook_key optional and safely no-op when missing
  args: { playbook_key: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const key = (args.playbook_key || "").trim();
    if (!key) {
      // Gracefully return empty list if no playbook key provided
      return [];
    }
    // ... keep existing code (delegate to the internal/version listing logic using the guaranteed key)
  },
});

// ... keep existing code (other exports)
