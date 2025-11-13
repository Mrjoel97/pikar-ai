import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Logo = { name: string; src: string };

export default function TrustedLogosMarquee({ logos }: { logos: Array<Logo> }) {
  const shouldReduceMotion = useReducedMotion();
  const marqueeAnim = shouldReduceMotion ? {} : { x: ["0%", "-50%"] };

  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-6 sm:mb-8"
        >
          <p className="text-sm sm:text-base font-medium text-foreground tracking-wide">
            Trusted by teams at
          </p>
        </motion.div>

        <div className="relative overflow-hidden">
          <motion.div
            className="flex items-center gap-6 sm:gap-8 whitespace-nowrap"
            animate={marqueeAnim}
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 20, repeat: Infinity, ease: "linear" }
            }
          >
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="neu-inset rounded-xl px-4 py-3 sm:px-5 sm:py-4 bg-card/80 hover:bg-card transition-colors"
              >
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="h-7 sm:h-8 mx-auto opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}