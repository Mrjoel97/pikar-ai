import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UpgradeNudgeBannerProps {
  message: string;
  onUpgrade: () => void;
}

export function UpgradeNudgeBanner({ message, onUpgrade }: UpgradeNudgeBannerProps) {
  return (
    <div className="rounded-md border p-3 bg-amber-50 flex items-center gap-3">
      <Badge variant="outline" className="border-amber-300 text-amber-700">
        Upgrade
      </Badge>
      <div className="text-sm">{message}</div>
      <div className="ml-auto">
        <Button size="sm" variant="outline" onClick={onUpgrade}>
          See Plans
        </Button>
      </div>
    </div>
  );
}
