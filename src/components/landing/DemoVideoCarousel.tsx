import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface DemoTierDefault {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  defaultVideoUrl: string;
  defaultThumbnail: string;
  defaultDuration: string;
  description: string;
  benefits: string[];
}

type DemoVideoCarouselProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTier?: (tier: string) => void;
  defaults: DemoTierDefault[];
};

export default function DemoVideoCarousel({ open, onOpenChange, onSelectTier, defaults }: DemoVideoCarouselProps) {
  const demoVideos = useQuery(api.demoVideos.list);

  // Merge database videos with default tier data
  const tierVideos = defaults.map(tier => ({
    ...tier,
    videoUrl: demoVideos?.find((v: any) => v.tier === tier.id)?.videoUrl || tier.defaultVideoUrl,
    thumbnail: demoVideos?.find((v: any) => v.tier === tier.id)?.thumbnail || tier.defaultThumbnail,
    duration: demoVideos?.find((v: any) => v.tier === tier.id)?.duration || tier.defaultDuration,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Watch Pikar AI in Action</DialogTitle>
          <p className="text-muted-foreground">
            Choose your business tier to see how Pikar AI transforms your workflow
          </p>
        </DialogHeader>

        <Tabs defaultValue="solopreneur" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto p-1">
            {tierVideos.map((tier) => {
              const Icon = tier.icon;
              return (
                <TabsTrigger
                  key={tier.id}
                  value={tier.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tier.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tierVideos.map((tier) => {
            const Icon = tier.icon;
            return (
              <TabsContent key={tier.id} value={tier.id} className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="neu-raised border-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`neu-inset rounded-xl p-3 ${tier.color} bg-opacity-10`}>
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{tier.name} Tier Demo</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="neu-inset">
                          {tier.duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="relative aspect-video rounded-xl overflow-hidden neu-inset bg-muted">
                        <iframe
                          src={tier.videoUrl}
                          title={`${tier.name} Demo Video`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">What You'll See:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tier.benefits.map((benefit, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm neu-inset rounded-lg p-3 bg-card/50"
                            >
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          className="flex-1 neu-raised bg-primary hover:bg-primary/90"
                          onClick={() => {
                            onSelectTier?.(tier.id);
                            onOpenChange(false);
                          }}
                        >
                          Start with {tier.name}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 neu-flat"
                          onClick={() => {
                            // Scroll to pricing section
                            onOpenChange(false);
                            setTimeout(() => {
                              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                          }}
                        >
                          View Pricing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}