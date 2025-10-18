import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

type LockedRibbonProps = {
  label?: string;
  onUpgrade?: () => void;
};

export function LockedRibbon({ label = "Feature requires upgrade", onUpgrade }: LockedRibbonProps) {
  return (
    <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10">
      <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-amber-300">
        <Lock className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">{label}</span>
        {onUpgrade && (
          <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-2">
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}
