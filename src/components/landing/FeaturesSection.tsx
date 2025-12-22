import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  image?: string;
};

export default function FeaturesSection({ features }: { features: Array<Feature> }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-accent/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3 md:mb-4 px-2">
            Powerful AI Capabilities
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Experience the future of business automation with our comprehensive AI platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="neu-raised rounded-xl sm:rounded-2xl border-0 h-full hover:shadow-lg transition-all duration-300 overflow-hidden p-0">
                {feature.image && (
                  <div className="relative h-32 sm:h-36 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      style={{
                        transform: 'perspective(1000px) rotateX(2deg)',
                        transformStyle: 'preserve-3d'
                      }}
                    />
                  </div>
                )}
                <CardContent className="p-4 sm:p-5">
                  <div className="neu-inset rounded-lg sm:rounded-xl p-2 sm:p-2.5 w-fit mb-3 sm:mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}