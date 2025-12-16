import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

// Import sub-components
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingChat from "@/components/landing/LandingChat";
import IndustriesSection from "@/components/landing/IndustriesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";

// Static imports for stability
import TrustedLogosMarquee from "@/components/landing/TrustedLogosMarquee";
import FeaturesSection from "@/components/landing/FeaturesSection";
import KpiTrendsCard from "@/components/landing/KpiTrendsCard";
import DemoVideoCarousel from "@/components/landing/DemoVideoCarousel";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

// Import data
import { trendData, features, tiers, trustedLogos, testimonials } from "@/lib/landing-data";

export default function Landing() {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise">("startup");
  const [isLoading] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGetStarted = () => {
    navigate("/dashboard");
  };

  const normalizeTier = (name: string): "solopreneur" | "startup" | "sme" | "enterprise" => {
    const k = name.toLowerCase();
    if (k.includes("solo")) return "solopreneur";
    if (k.includes("start")) return "startup";
    if (k.includes("sme")) return "sme";
    return "enterprise";
  };

  const openUpgrade = (name?: string) => {
    if (name) setSelectedTier(normalizeTier(name));
    setUpgradeOpen(true);
  };

  const handleDemoTierSelect = (tier: string) => {
    setSelectedTier(normalizeTier(tier));
    navigate(`/dashboard?tier=${tier}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/5 overflow-x-hidden"
    >
      {/* Add a skip link for accessibility at the top of the page */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring">
        Skip to content
      </a>

      <LandingNavbar handleGetStarted={handleGetStarted} scrollTo={scrollTo} />

      <LandingHero handleGetStarted={handleGetStarted} setDemoOpen={setDemoOpen} />

      {/* High-Traction Industries */}
      <IndustriesSection />

      {/* Trusted Logos - Animated Marquee */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <TrustedLogosMarquee logos={trustedLogos} />
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <FeaturesSection features={features} />
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <KpiTrendsCard data={trendData} />
      </motion.div>

      {/* Benefits Card - What You Get with Pikar AI */}
      <BenefitsSection handleGetStarted={handleGetStarted} />

      {/* Demo Video Carousel */}
      <DemoVideoCarousel
        open={demoOpen}
        onOpenChange={setDemoOpen}
        onSelectTier={handleDemoTierSelect}
      />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      <LandingPricing tiers={tiers} openUpgrade={openUpgrade} />

      <LandingCTA openUpgrade={openUpgrade} isLoading={isLoading} />

      <LandingFooter />

      <LandingChat />
    </motion.div>
  );
}