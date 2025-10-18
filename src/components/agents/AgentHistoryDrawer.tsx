import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";

export type AskHistoryEntry = { q: string; a: string; at: number };

interface AgentHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: AskHistoryEntry[];
  onExport: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function AgentHistoryDrawer({
  open,
  onOpenChange,
  entries,
  onExport,
  onClear,
  onClose,
}: AgentHistoryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Conversation History</SheetTitle>
          <SheetDescription>Your recent questions and summarized answers.</SheetDescription>
        </SheetHeader>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            disabled={entries.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {entries.length === 0 ? (
            <div className="text-sm text-gray-600">
              No history yet. Ask something to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((h, idx) => (
                <div key={idx} className="rounded-md border bg-white p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(h.at).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Q:</span> {h.q}
                  </div>
                  <div className="text-sm mt-1 whitespace-pre-wrap">
                    <span className="font-medium">A:</span> {h.a}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="destructive" onClick={onClear} disabled={entries.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
