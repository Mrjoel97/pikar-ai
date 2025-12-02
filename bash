grep -nE "defineTable\(\"(audit_logs|approvalQueue)\"" src/convex/schema.ts && tail -n 50 src/convex/schema.ts
