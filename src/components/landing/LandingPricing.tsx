import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface Tier {
  name: string;
  price: string;
  description: string;
  features: string[];
}

interface LandingPricingProps {
  tiers: Tier[];
  openUpgrade: (name?: string) => void;
}

export default function LandingPricing({ tiers, openUpgrade }: LandingPricingProps) {
  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3 md:mb-4 px-2">
            Choose Your Growth Path
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            From solopreneurs to enterprises, we have the perfect plan for your business size
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`neu-raised rounded-xl sm:rounded-2xl border-0 h-full ${index === 1 ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-5 sm:p-6">
                  {index === 1 && (
                    <div className="text-center mb-3 sm:mb-4">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">{tier.name}</h3>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">{tier.price}</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                  <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-5 md:mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-primary mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button 
                      className="w-full neu-flat rounded-xl text-sm sm:text-base py-5 sm:py-6"
                      variant={index === 1 ? "default" : "outline"}
                      onClick={() => openUpgrade(tier.name)}
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}