import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

interface KpiSummaryCardsProps {
  summary: Record<string, any>;
}

export function KpiSummaryCards({ summary }: KpiSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Object.entries(summary).map(([key, value]: [string, any], index) => {
        const isPositive = typeof value === "number" && value > 0;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </div>
                  {isPositive && (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
