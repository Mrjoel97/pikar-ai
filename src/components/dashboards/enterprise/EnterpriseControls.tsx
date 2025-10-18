import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router";

interface EnterpriseControlsProps {
  hasTier: (tier: string) => boolean;
  onUpgrade: () => void;
}

export function EnterpriseControls({ hasTier, onUpgrade }: EnterpriseControlsProps) {
  const nav = useNavigate();

  return (
    <Card className="xl:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle>Quick Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => nav("/enterprise/security")}
        >
          <Shield className="h-4 w-4 mr-2" />
          Security Dashboard
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => nav("/enterprise/portfolio")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Portfolio Management
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => nav("/team")}
        >
          <Users className="h-4 w-4 mr-2" />
          Team Management
        </Button>
      </CardContent>
    </Card>
  );
}