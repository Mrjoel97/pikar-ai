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

        <div className="relative overflow-hidden py-4">
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
                className="neu-inset rounded-xl px-6 py-4 sm:px-7 sm:py-5 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center min-w-[140px]"
              >
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="h-8 sm:h-10 w-auto mx-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                  loading="eager"
                  style={{ filter: 'grayscale(100%) contrast(1.2)' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-sm font-semibold text-gray-700">${logo.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}