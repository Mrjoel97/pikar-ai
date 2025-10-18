import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ComplianceWarningsProps {
  warnings: string[];
  onLearn: () => void;
}

export function ComplianceWarnings({ warnings, onLearn }: ComplianceWarningsProps) {
  if (!warnings?.length) return null;
  return (
    <Alert variant="destructive">
      <AlertTitle>Compliance preflight warnings</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 space-y-1">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={onLearn}>
            Learn about email consent & unsubscribe best practices
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
