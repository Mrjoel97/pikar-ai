import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";

interface GuestTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestTier: string;
  setGuestTier: (tier: "solopreneur" | "startup" | "sme" | "enterprise") => void;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function GuestTierDialog({
  open,
  onOpenChange,
  guestTier,
  setGuestTier,
  isLoading,
  error,
  onConfirm,
}: GuestTierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92vw] neu-raised rounded-2xl border-0">
        <DialogHeader>
          <DialogTitle>Select a dashboard tier</DialogTitle>
          <DialogDescription>
            Preview Pikar using a tier-specific dashboard while signed in as a guest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup
            value={guestTier}
            onValueChange={(v) =>
              setGuestTier(v as "solopreneur" | "startup" | "sme" | "enterprise")
            }
            className="grid grid-cols-1 gap-3"
          >
            <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
              <RadioGroupItem id="tier-solo" value="solopreneur" />
              <Label htmlFor="tier-solo" className="cursor-pointer">
                Solopreneur — $99/mo
              </Label>
            </div>
            <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
              <RadioGroupItem id="tier-startup" value="startup" />
              <Label htmlFor="tier-startup" className="cursor-pointer">
                Startup — $297/mo
              </Label>
            </div>
            <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
              <RadioGroupItem id="tier-sme" value="sme" />
              <Label htmlFor="tier-sme" className="cursor-pointer">
                SME — $597/mo
              </Label>
            </div>
            <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
              <RadioGroupItem id="tier-enterprise" value="enterprise" />
              <Label htmlFor="tier-enterprise" className="cursor-pointer">
                Enterprise — Custom
              </Label>
            </div>
          </RadioGroup>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="neu-flat rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="neu-raised rounded-xl bg-primary hover:bg-primary/90"
            onClick={onConfirm}
            disabled={isLoading || !guestTier}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : (
              <>
                Continue as Guest
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
