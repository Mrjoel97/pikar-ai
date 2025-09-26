import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Trend = { month: string; revenue: number; leads: number; efficiency: number };

export default function KpiTrendsCard({ data }: { data: Array<Trend> }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
            KPI Trends Preview
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            A glimpse of how your business trends evolve over time.
          </p>
        </motion.div>

        <Card className="neu-raised rounded-2xl border-0">
          <CardContent className="p-4 sm:p-6">
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "oklch(62% 0.15 30)" },
                efficiency: { label: "Efficiency", color: "oklch(62% 0.15 150)" },
              }}
              className="rounded-xl bg-card/60"
            >
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="var(--color-efficiency)"
                  fill="var(--color-efficiency)"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
