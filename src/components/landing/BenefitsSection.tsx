import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, BarChart3, Zap, Shield, Users, DollarSign } from "lucide-react";

interface BenefitsSectionProps {
  handleGetStarted: () => void;
}

export default function BenefitsSection({ handleGetStarted }: BenefitsSectionProps) {
  const benefits = [
    {
      icon: Zap,
      title: "10x Faster Execution",
      description: "Automate repetitive tasks and workflows, freeing up 15+ hours per week to focus on strategic growth initiatives.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: BarChart3,
      title: "Data-Driven Insights",
      description: "Real-time analytics and predictive intelligence help you make informed decisions that drive 3x revenue growth.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Brain,
      title: "AI-Powered Agents",
      description: "Deploy specialized AI agents for content creation, customer support, sales, and marketing—working 24/7 for you.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, 95%+ compliance automation, and SOC 2 certified infrastructure protect your business data.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Users,
      title: "Seamless Collaboration",
      description: "Unite your team with integrated workflows, real-time updates, and AI-assisted coordination across all departments.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: DollarSign,
      title: "Proven ROI",
      description: "Average 340% ROI in 4 months. Our customers save $50K+ annually while increasing revenue by 200%+.",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&q=80"
    }
  ];

  return (
    <motion.section
      className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-primary/5 via-accent/3 to-background border border-primary/15 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg">
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-primary/20 text-primary border-primary/30">
                Transform Your Business Today
              </Badge>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground px-2">
              What You Get with Pikar AI
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
              Join thousands of businesses already experiencing exponential growth with our AI-powered platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                viewport={{ once: true }}
              >
                <div className="relative h-32 sm:h-40 overflow-hidden">
                  <img
                    src={benefit.image}
                    alt={benefit.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-2 sm:mb-3">
                    <div className="p-2.5 sm:p-3 bg-primary/10 backdrop-blur-sm rounded-lg">
                      <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">{benefit.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            className="text-center mt-8 sm:mt-10 px-4"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Start Your Free Trial Today
              <Zap className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}