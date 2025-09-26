import { motion, useReducedMotion } from "framer-motion";

type Tip = {
  phase: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function ContextualTipsStrip({ tips }: { tips: Array<Tip> }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {tips.map((t) => (
            <div key={t.phase} className="neu-inset rounded-xl p-4 bg-card/60">
              <div className="flex items-start gap-3">
                <t.icon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{t.phase} Tip</p>
                  <p className="text-sm text-muted-foreground">{t.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
