import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface VendorRiskTabProps {
  riskAssessment: any;
}

export function VendorRiskTab({ riskAssessment }: VendorRiskTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment Summary</CardTitle>
        <CardDescription>Vendor risk breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium">High Risk Vendors</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{riskAssessment?.highRisk || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Medium Risk Vendors</span>
            </div>
            <span className="text-2xl font-bold text-orange-600">{riskAssessment?.mediumRisk || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Low Risk Vendors</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{riskAssessment?.lowRisk || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
