import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import RubiksCubeAnimation from "@/components/landing/RubiksCubeAnimation";

interface LandingHeroProps {
  handleGetStarted: () => void;
  setDemoOpen: (open: boolean) => void;
}

export default function LandingHero({ handleGetStarted, setDemoOpen }: LandingHeroProps) {
  const heroStats = [
    { label: "Active Users", value: "8.2k+" },
    { label: "Avg. ROI Increase", value: "34%" },
    { label: "Workflows Automated", value: "12k+" },
    { label: "Avg. Setup Time", value: "7m" },
  ];

  return (
    <section
      id="main"
      className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8"
    >
      {/* Rubik's Cube Animation */}
      <RubiksCubeAnimation />

      {/* Static gradient overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.95),rgba(255,255,255,0.9)_45%,transparent_70%)]" />
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6 neu-inset"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </motion.div>
            <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Business Intelligence</span>
          </motion.div>
          
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 leading-[1.15] sm:leading-[1.12] md:leading-[1.1] px-2"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-foreground block sm:inline"
            >
              Transform Your Business
            </motion.span>
            <br className="hidden sm:block" />
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-primary"
            >
              and Ideas
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="text-foreground"
            >
              with AI
            </motion.span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4"
          >
            Pikar AI helps entrepreneurs and businesses evaluate ideas, diagnose problems,
            and integrate with ERP systems using cutting-edge artificial intelligence.
          </motion.p>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 sm:px-0"
          >
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.7 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto neu-raised rounded-xl bg-primary hover:bg-primary/90 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
                onClick={handleGetStarted}
                aria-label="Start free assessment"
              >
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.9 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto neu-flat rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
                variant="outline"
                onClick={() => setDemoOpen(true)}
                aria-label="Watch demo"
              >
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        className="mt-8 sm:mt-10 md:mt-12 relative z-10 px-2"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
          {heroStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="neu-inset rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 bg-card/70 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-black">{stat.value}</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-tight mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}