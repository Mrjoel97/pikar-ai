"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Determine winner using statistical analysis
export const determineWinner = action({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args): Promise<{
    winnerId: Id<"experimentVariants"> | null;
    isSignificant: boolean;
    bestVariantKey: string;
    conversionRate: number;
    confidenceLevel: number | null;
  }> => {
    // @ts-ignore - suppress TS7016 when ambient types aren't picked up during build
    const jstat: any = await import("jstat");

    const experiment: any = await ctx.runQuery(internal.experiments.getExperimentById, {
      experimentId: args.experimentId,
    });

    if (!experiment || !experiment.variants) {
      throw new Error("Experiment not found");
    }

    const variants: any[] = experiment.variants;
    const confidenceLevel = experiment.configuration.confidenceLevel / 100;

    // Find variant with highest conversion rate
    let bestVariant: any = variants[0];
    let bestRate = 0;

    for (const variant of variants) {
      const rate = variant.metrics.sent > 0
        ? variant.metrics.converted / variant.metrics.sent
        : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestVariant = variant;
      }
    }

    // Perform chi-square test for statistical significance
    let isSignificant = true;
    const minSampleSize = experiment.configuration.minimumSampleSize;

    for (const variant of variants) {
      if (variant._id === bestVariant._id) continue;

      // Check minimum sample size
      if (variant.metrics.sent < minSampleSize || bestVariant.metrics.sent < minSampleSize) {
        isSignificant = false;
        break;
      }

      // Chi-square test
      const observed = [
        [bestVariant.metrics.converted, bestVariant.metrics.sent - bestVariant.metrics.converted],
        [variant.metrics.converted, variant.metrics.sent - variant.metrics.converted],
      ];

      try {
        const chiSquare = jstat.jStat.chisquare.test(observed, 1);
        if (chiSquare > (1 - confidenceLevel)) {
          isSignificant = false;
          break;
        }
      } catch (e) {
        console.error("Chi-square test failed:", e);
        isSignificant = false;
        break;
      }
    }

    return {
      winnerId: isSignificant ? bestVariant._id : null,
      isSignificant,
      bestVariantKey: bestVariant.variantKey,
      conversionRate: bestRate * 100,
      confidenceLevel: isSignificant ? experiment.configuration.confidenceLevel : null,
    };
  },
});
