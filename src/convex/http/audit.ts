import { httpAction } from "../_generated/server";

export const exportAuditLogs = httpAction(async (ctx: any, req) => {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const action = url.searchParams.get("action") || undefined;
  const entityType = url.searchParams.get("entityType") || undefined;
  const limit = Number(url.searchParams.get("limit") || "1000");

  if (!businessId) {
    return new Response("Missing businessId", { status: 400 });
  }

  const args: any = {
    businessId,
    startDate: startDate ? Number(startDate) : undefined,
    endDate: endDate ? Number(endDate) : undefined,
    action,
    entityType,
    limit: isNaN(limit) ? 1000 : Math.min(Math.max(limit, 1), 2000),
  };

  const logs: Array<any> = await (ctx as any).runQuery("audit:searchAuditLogs" as any, args);

  const headers = ["createdAt", "action", "entityType", "entityId", "userId", "details"];
  const esc = (v: any) => {
    const s =
      v === null || v === undefined
        ? ""
        : typeof v === "string"
        ? v
        : typeof v === "number"
        ? String(v)
        : JSON.stringify(v);
    const needsQuotes = s.includes(",") || s.includes('"') || s.includes("\n");
    const doubled = s.replace(/"/g, '""');
    return needsQuotes ? `"${doubled}"` : doubled;
  };

  const lines: string[] = [headers.join(",")];
  for (const r of logs) {
    lines.push(
      [
        r.createdAt,
        r.action,
        r.entityType,
        r.entityId ?? "",
        r.userId ?? "",
        r.details ? JSON.stringify(r.details) : "",
      ]
        .map(esc)
        .join(","),
    );
  }

  const csv = lines.join("\n");
  const disposition = `attachment; filename="audit_${new Date().toISOString().slice(0, 10)}.csv"`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
});
