import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export function SolopreneurDashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.7 }}
    >
      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Solopreneur</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Streamlined view tailored for solo operators.
        </CardContent>
      </Card>
    </motion.div>
  );
}