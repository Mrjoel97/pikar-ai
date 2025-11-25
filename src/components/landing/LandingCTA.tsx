import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Loader2 } from "lucide-react";

interface LandingCTAProps {
  openUpgrade: () => void;
  isLoading: boolean;
}

export default function LandingCTA({ openUpgrade, isLoading }: LandingCTAProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Target className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold tracking-tight mb-6 text-white">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Pikar AI to automate operations, boost productivity, and accelerate growth.
          </p>
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto neu-raised rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold shadow-xl"
              onClick={() => openUpgrade()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
