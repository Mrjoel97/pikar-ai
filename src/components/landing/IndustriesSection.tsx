import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface IndustriesSectionProps {
  industries: string[];
}

export default function IndustriesSection({ industries }: IndustriesSectionProps) {
  const randomIndustries = useMemo(() => {
    const shuffled = [...industries].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [industries]);

  return (
    <motion.section 
      className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-3 sm:mb-4"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-xs sm:text-sm text-muted-foreground tracking-wide">
            High‑Traction Industries We Support
          </p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3">
          {randomIndustries.map((ind, index) => (
            <motion.div
              key={ind}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1 }}
            >
              <Badge
                variant="secondary"
                className="neu-inset rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 bg-card/70 text-xs sm:text-sm"
              >
                {ind}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
