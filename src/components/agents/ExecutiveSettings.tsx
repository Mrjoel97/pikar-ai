import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExecutiveSettingsProps {
  execGoals: string;
  setExecGoals: (value: string) => void;
  execTone: string;
  setExecTone: (value: string) => void;
  execCadence: string;
  setExecCadence: (value: string) => void;
  execSaving: boolean;
  execLastSavedAt: number | null;
  onSave: () => void;
  onReset: () => void;
}

export function ExecutiveSettings({
  execGoals,
  setExecGoals,
  execTone,
  setExecTone,
  execCadence,
  setExecCadence,
  execSaving,
  execLastSavedAt,
  onSave,
  onReset,
}: ExecutiveSettingsProps) {
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Executive Settings</span>
          {execLastSavedAt && (
            <span className="text-xs text-gray-500">
              Last saved {new Date(execLastSavedAt).toLocaleString()}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Update your Executive Assistant's goals, tone, and cadence. These guide playbooks and suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Goals / Focus</Label>
          <Textarea
            rows={3}
            value={execGoals}
            onChange={(e) => setExecGoals(e.target.value)}
            placeholder="Describe what you want your assistant to prioritize"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Tone / Persona</Label>
            <Input
              value={execTone}
              onChange={(e) => setExecTone(e.target.value)}
              placeholder="e.g., practical, concise, friendly"
            />
          </div>
          <div>
            <Label className="text-sm">Cadence</Label>
            <Select value={execCadence} onValueChange={setExecCadence}>
              <SelectTrigger><SelectValue placeholder="Select cadence" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onReset}>
            Reset
          </Button>
          <Button onClick={onSave} disabled={execSaving}>
            {execSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
