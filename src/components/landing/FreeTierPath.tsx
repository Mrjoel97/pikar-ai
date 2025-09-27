import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Target } from "lucide-react";
// Removed unused motion/useReducedMotion and incorrect Tanstack useQuery import

type Phase = { title: string; desc: string };

export default function FreeTierPath({
  growthPhases,
  upgradeTrigger,
}: {
  growthPhases: ReadonlyArray<Phase>;
  upgradeTrigger: string;
}) {
  // Removed unused reduce motion and upgrade nudges query

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-accent/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Free Tier: Enhanced Growth Pathway
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            A clear roadmap from idea to traction—built for solopreneurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {growthPhases.map((p) => (
            <Card key={p.title} className="neu-raised rounded-2xl border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold">{p.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          <Card className="neu-inset rounded-2xl border-0 bg-card/70">
            <CardContent className="p-5 flex items-start sm:items-center gap-3 sm:gap-4">
              <Target className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Upgrade Trigger</p>
                <p className="text-sm text-muted-foreground">{upgradeTrigger}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}