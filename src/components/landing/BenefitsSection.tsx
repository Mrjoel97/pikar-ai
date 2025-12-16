import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BarChart3, Zap, Shield, Users, DollarSign } from "lucide-react";

interface BenefitsSectionProps {
  handleGetStarted: () => void;
}

export default function BenefitsSection({ handleGetStarted }: BenefitsSectionProps) {
  return (
    <motion.section
      className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-primary/5 via-accent/3 to-background border border-primary/15 rounded-2xl p-8 sm:p-12 shadow-lg">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 px-4 py-2 text-sm font-semibold bg-primary/20 text-primary border-primary/30">
                Transform Your Business Today
              </Badge>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              What You Get with Pikar AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Join thousands of businesses already experiencing exponential growth with our AI-powered platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <motion.div
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">10x Faster Execution</h3>
              </div>
              <p className="text-muted-foreground">
                Automate repetitive tasks and workflows, freeing up 15+ hours per week to focus on strategic growth initiatives.
              </p>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Data-Driven Insights</h3>
              </div>
              <p className="text-muted-foreground">
                Real-time analytics and predictive intelligence help you make informed decisions that drive 3x revenue growth.
              </p>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">AI-Powered Agents</h3>
              </div>
              <p className="text-muted-foreground">
                Deploy specialized AI agents for content creation, customer support, sales, and marketing—working 24/7 for you.
              </p>
            </motion.div>

            {/* Benefit 4 */}
            <motion.div
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Enterprise Security</h3>
              </div>
              <p className="text-muted-foreground">
                Bank-level encryption, 95%+ compliance automation, and SOC 2 certified infrastructure protect your business data.
              </p>
            </motion.div>

            {/* Benefit 5 */}
            <motion.div
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Seamless Collaboration</h3>
              </div>
              <p className="text-muted-foreground">
                Unite your team with integrated workflows, real-time updates, and AI-assisted coordination across all departments.
              </p>
            </motion.div>

            {/* Benefit 6 */}
            <motion.div
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Proven ROI</h3>
              </div>
              <p className="text-muted-foreground">
                Average 340% ROI in 4 months. Our customers save $50K+ annually while increasing revenue by 200%+.
              </p>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div
            className="text-center mt-10"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Start Your Free Trial Today
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
