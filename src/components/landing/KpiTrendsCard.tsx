import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, Users, DollarSign, Zap, Target, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Trend = { month: string; revenue: number; leads: number; efficiency: number };

export default function KpiTrendsCard({ data }: { data: Array<Trend> }) {
  const shouldReduceMotion = useReducedMotion();
  
  const growthMetrics = [
    {
      icon: TrendingUp,
      label: "Revenue Growth",
      value: "+58%",
      subtext: "vs last quarter",
      color: "text-white",
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      icon: Users,
      label: "Active Users",
      value: "8.2k+",
      subtext: "across all tiers",
      color: "text-white",
      bgColor: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    },
    {
      icon: DollarSign,
      label: "Avg. ROI",
      value: "340%",
      subtext: "in first 6 months",
      color: "text-white",
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      icon: Zap,
      label: "Time Saved",
      value: "15+ hrs",
      subtext: "per week per user",
      color: "text-white",
      bgColor: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    },
  ];

  const testimonialStats = [
    { metric: "95%", label: "Customer Satisfaction" },
    { metric: "12k+", label: "Workflows Automated" },
    { metric: "7 min", label: "Avg. Setup Time" },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-emerald-50/30 to-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-14 sm:mb-20"
        >
          <Badge variant="secondary" className="mb-5 neu-inset bg-emerald-100 text-emerald-700 border-emerald-200">
            <Target className="h-3 w-3 mr-1" />
            Real Results from Real Businesses
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Transform Your Business Metrics
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            See how Pikar AI drives measurable growth across key business indicators
          </p>
        </motion.div>

        {/* Growth Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 mb-10 sm:mb-16">
          {growthMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`${metric.bgColor} rounded-2xl border-0 h-full hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg`}>
                <CardContent className="p-6 sm:p-7">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-5">
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className={`text-3xl sm:text-4xl font-bold ${metric.color}`}>{metric.value}</div>
                    <ArrowUpRight className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className={`text-base font-semibold ${metric.color} mb-1`}>{metric.label}</div>
                  <div className="text-sm text-white/90">{metric.subtext}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Chart with Stats - Updated Layout */}
        <div className="grid lg:grid-cols-3 gap-7 items-stretch">
          {/* Chart - Takes 2 columns with 3D effect */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Card className="neu-raised rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow h-full" style={{
              transform: 'perspective(1000px) rotateX(2deg)',
              transformStyle: 'preserve-3d'
            }}>
              <CardContent className="p-5 sm:p-7">
                <div className="mb-5">
                  <h3 className="text-xl font-bold mb-2 text-emerald-700">Performance Trends</h3>
                  <p className="text-sm text-muted-foreground">
                    Revenue & efficiency growth over 6 months
                  </p>
                </div>
                <div style={{
                  transform: 'translateZ(20px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}>
                  <ChartContainer
                    config={{
                      revenue: { label: "Revenue", color: "hsl(160, 84%, 39%)" },
                      efficiency: { label: "Efficiency", color: "hsl(160, 60%, 50%)" },
                    }}
                    className="rounded-xl bg-emerald-50/50 h-[260px] sm:h-[300px]"
                  >
                    <AreaChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                      <XAxis dataKey="month" stroke="#059669" />
                      <YAxis stroke="#059669" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        fill="var(--color-revenue)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="efficiency"
                        stroke="var(--color-efficiency)"
                        fill="var(--color-efficiency)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
                
                {/* Graph Description */}
                <div className="mt-5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    <span className="font-semibold">What this shows:</span> This chart tracks the average performance metrics of businesses using Pikar AI over a 6-month period. The <span className="font-medium text-emerald-700">revenue line</span> demonstrates consistent monthly growth, while the <span className="font-medium text-emerald-600">efficiency line</span> shows operational improvements through AI automation. Real data from 8,200+ active users across all tiers.
                  </p>
                  <p className="text-sm text-emerald-800 leading-relaxed mt-3">
                    <span className="font-semibold">Why it matters:</span> These trends showcase the compound effect of AI-powered automation on business performance. Companies typically see initial gains within the first month, with accelerating returns as AI agents learn and optimize workflows. The steady upward trajectory reflects how businesses scale operations without proportionally increasing costs or headcount.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Column - Extended to fill space */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-5 flex flex-col"
          >
            {testimonialStats.map((stat, index) => (
              <Card key={stat.label} className="neu-raised rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">{stat.metric}</div>
                  <div className="text-sm font-medium text-emerald-700">{stat.label}</div>
                </CardContent>
              </Card>
            ))}

            {/* Social Proof - Extended to fill remaining space */}
            <Card className="neu-raised rounded-2xl border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex-grow">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-9 w-9 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-white">+8,200 users</span>
                </div>
                <p className="text-sm text-white font-semibold leading-relaxed">
                  "Pikar AI transformed how we work. Setup took minutes, results came in days."
                </p>
                <p className="text-xs text-white/90 mt-3 font-medium">— Sarah K., Startup Founder</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}