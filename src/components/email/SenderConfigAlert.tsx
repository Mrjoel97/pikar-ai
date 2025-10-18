import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SenderConfigAlertProps {
  show: boolean;
  missingFromEmail: boolean;
  missingReplyTo: boolean;
  onFix: () => void;
}

export function SenderConfigAlert({
  show,
  missingFromEmail,
  missingReplyTo,
  onFix,
}: SenderConfigAlertProps) {
  if (!show) return null;
  return (
    <div className="mb-4">
      <Alert variant="destructive">
        <AlertTitle>Sender configuration required</AlertTitle>
        <AlertDescription>
          Please configure your workspace sender before sending:
          {missingFromEmail ? " From Email" : ""}
          {missingFromEmail && missingReplyTo ? " and" : ""}
          {missingReplyTo ? " Reply-To" : ""}.
          <div className="mt-3">
            <Button
              variant="secondary"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onFix}
            >
              Fix sender in Settings
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
