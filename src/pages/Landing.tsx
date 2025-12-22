import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Brain, BarChart3, Zap, Shield, Users } from "lucide-react";

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

// Add static KPI trend data used by KpiTrendsCard
const trendData: Array<{ month: string; revenue: number; leads: number; efficiency: number }> = [
  { month: "Jan", revenue: 12000, leads: 240, efficiency: 80 },
  { month: "Feb", revenue: 13500, leads: 260, efficiency: 82 },
  { month: "Mar", revenue: 15000, leads: 300, efficiency: 84 },
  { month: "Apr", revenue: 16200, leads: 320, efficiency: 86 },
  { month: "May", revenue: 17500, leads: 340, efficiency: 87 },
  { month: "Jun", revenue: 19000, leads: 360, efficiency: 89 },
];

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

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Agents",
      description: "Deploy specialized AI agents for content creation, sales intelligence, and customer support."
    },
    {
      icon: Brain,
      title: "Intelligent Orchestration", 
      description: "Seamlessly coordinate multiple AI agents to execute complex business workflows."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get real-time insights and predictive analytics to optimize your business performance."
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Streamline operations with intelligent automation that adapts to your business needs."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with compliance standards for data protection and privacy."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Enable seamless collaboration between human teams and AI agents."
    }
  ];

  const tiers = [
    {
      name: "Solopreneur",
      price: "$99/mo",
      description: "Your AI-Powered Business Assistant",
      features: [
        "Get 15+ hours back per week",
        "Launch professional campaigns in minutes",
        "Never miss a lead or opportunity again",
        "3 Essential AI Agents (Content, Marketing, Productivity)",
      ],
    },
    {
      name: "Startup",
      price: "$297/mo",
      description: "Scale Your Team's Impact",
      features: [
        "Coordinate your growing team effortlessly",
        "3x your lead generation",
        "Make data-driven decisions daily",
        "10 AI Agents + Team Collaboration",
      ],
    },
    {
      name: "SME",
      price: "$597/mo",
      description: "Enterprise-Grade Business Orchestration",
      features: [
        "Unify all departments under one platform",
        "Ensure 95%+ compliance automatically",
        "Scale across multiple brands/locations",
        "Unlimited AI Agents + Custom Configurations",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Global Business Transformation Platform",
      features: [
        "Transform operations across global teams",
        "Custom AI agents for your unique needs",
        "White-label and API access included",
        "Unlimited Custom AI Agents",
      ],
    }
  ];

  const trustedLogos = [
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe/0A2540" },
    { name: "Google", src: "https://cdn.simpleicons.org/google/1A73E8" },
    { name: "Slack", src: "https://logo.clearbit.com/slack.com" },
    { name: "Notion", src: "https://cdn.simpleicons.org/notion/0F0F0F" },
    { name: "HubSpot", src: "https://cdn.simpleicons.org/hubspot/FF7A59" },
    { name: "Salesforce", src: "https://cdn.simpleicons.org/salesforce/00A1E0" },
    { name: "Shopify", src: "https://cdn.simpleicons.org/shopify/95BF47" },
  ];

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
      <TestimonialsSection testimonials={[
          {
            name: "Sarah Chen",
            role: "Founder & CEO",
            company: "TechFlow SaaS",
            industry: "SaaS",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
            quote: "Pikar AI helped us automate our entire customer onboarding process. We've seen a 340% ROI in just 4 months and saved 20+ hours per week.",
            tier: "Startup"
          },
          {
            name: "Marcus Johnson",
            role: "Operations Director",
            company: "HealthCare Plus",
            industry: "Healthcare",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
            quote: "The compliance automation alone is worth it. We maintain 98% compliance scores effortlessly while our team focuses on patient care.",
            tier: "SME"
          },
          {
            name: "Elena Rodriguez",
            role: "Marketing Lead",
            company: "GreenLeaf Organics",
            industry: "eCommerce",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
            quote: "Our social media engagement tripled within 2 months. The AI content creation is phenomenal - it understands our brand voice perfectly.",
            tier: "Solopreneur"
          },
          {
            name: "David Park",
            role: "CTO",
            company: "FinSecure",
            industry: "Fintech",
            image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
            quote: "Enterprise-grade security with startup-level agility. The API integration was seamless, and we're processing 10x more transactions.",
            tier: "Enterprise"
          },
          {
            name: "Priya Sharma",
            role: "Owner",
            company: "Wellness Studio",
            industry: "Fitness & Wellness",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
            quote: "As a solo business owner, Pikar AI is like having a full team. Client bookings are up 150%, and I finally have time for myself.",
            tier: "Solopreneur"
          },
          {
            name: "James Mitchell",
            role: "VP of Sales",
            company: "LogiTrans Global",
            industry: "Logistics",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
            quote: "The workflow automation across departments saved us $2M annually. Our delivery times improved by 35% with better coordination.",
            tier: "Enterprise"
          }
        ]} />

      <LandingPricing tiers={tiers} openUpgrade={openUpgrade} />

      <LandingCTA openUpgrade={openUpgrade} isLoading={isLoading} />

      <LandingFooter />

      <LandingChat />
    </motion.div>
  );
}