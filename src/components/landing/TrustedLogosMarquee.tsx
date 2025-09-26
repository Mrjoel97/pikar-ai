import { motion, useReducedMotion } from "framer-motion";

type Logo = { name: string; src: string };

export default function TrustedLogosMarquee({ logos }: { logos: Array<Logo> }) {
  const shouldReduceMotion = useReducedMotion();
  const marqueeAnim = shouldReduceMotion ? {} : { x: ["0%", "-50%"] };

  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-8"
        >
          <p className="text-xs sm:text-sm text-muted-foreground tracking-wide">
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
                className="neu-inset rounded-xl px-3 py-2 sm:px-4 sm:py-3 bg-card/60"
              >
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="h-6 sm:h-7 mx-auto opacity-75 saturate-0"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
