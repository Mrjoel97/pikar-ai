import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UpgradeCTAProps {
  feature: string;
  onUpgrade: () => void;
}

export function UpgradeCTA({ feature, onUpgrade }: UpgradeCTAProps) {
  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Upgrade to SME</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get {feature} with governance features
        </p>
        <Button onClick={onUpgrade} size="sm">
          Upgrade to SME
        </Button>
      </CardContent>
    </Card>
  );
}
