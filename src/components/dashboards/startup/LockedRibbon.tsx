import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LockedRibbonProps {
  label?: string;
  onUpgrade: () => void;
}

export function LockedRibbon({ label = "Feature requires upgrade", onUpgrade }: LockedRibbonProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
      <span>{label}</span>
      <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">
        Upgrade
      </Button>
    </div>
  );
}
