import React, { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Brain, BarChart3, Zap, Shield, Users } from "lucide-react";

// Import sub-components - Keep critical above-the-fold components
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingChat from "@/components/landing/LandingChat";

// Lazy load below-the-fold components
const IndustriesSection = lazy(() => import("@/components/landing/IndustriesSection"));
const TrustedLogosMarquee = lazy(() => import("@/components/landing/TrustedLogosMarquee"));
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection"));
const KpiTrendsCard = lazy(() => import("@/components/landing/KpiTrendsCard"));
const BenefitsSection = lazy(() => import("@/components/landing/BenefitsSection"));
const DemoVideoCarousel = lazy(() => import("@/components/landing/DemoVideoCarousel"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const LandingPricing = lazy(() => import("@/components/landing/LandingPricing"));
const LandingCTA = lazy(() => import("@/components/landing/LandingCTA"));

// Loading fallback component
const SectionLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

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
      description: "Deploy specialized AI agents for content creation, sales intelligence, and customer support.",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Brain,
      title: "Intelligent Orchestration", 
      description: "Seamlessly coordinate multiple AI agents to execute complex business workflows.",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get real-time insights and predictive analytics to optimize your business performance.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Streamline operations with intelligent automation that adapts to your business needs.",
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with compliance standards for data protection and privacy.",
      image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=600&fit=crop&q=80"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Enable seamless collaboration between human teams and AI agents.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80"
    }
  ];

  const tiers = [
    {
      name: "Solopreneur",
      price: "$99/mo",
      description: "Your AI-Powered Business Assistant",
      features: [
        "3 Core AI Agents (Content, Marketing, Productivity)",
        "Social Media Scheduler & Content Calendar",
        "Email Campaign Builder & Automation",
        "Invoice & Payment Management",
        "Voice Notes & Brain Dump Capture",
        "Customer Relationship Management",
        "Basic Analytics & Performance Tracking",
        "Personal Brand Builder",
        "Task Automation Suite",
        "1,000 AI Actions/month",
        "Email Support (24-48hr)",
        "1 User Account"
      ],
    },
    {
      name: "Startup",
      price: "$297/mo",
      description: "Scale Your Team's Impact",
      features: [
        "10 AI Agents (All Solopreneur + Sales, Support, Ops)",
        "Team Collaboration & Workflow Management",
        "CRM Integration (HubSpot, Salesforce, Pipedrive)",
        "Customer Journey Mapping & Automation",
        "A/B Testing & Conversion Optimization",
        "Approval Workflows & Governance",
        "ROI Dashboard & Revenue Attribution",
        "Advanced Analytics & Predictive Insights",
        "API Access & Webhooks",
        "10,000 AI Actions/month",
        "Priority Support (12hr)",
        "Up to 10 Team Members"
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

  const testimonials = [
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

      {/* Lazy loaded sections with Suspense boundaries */}
      <Suspense fallback={<SectionLoader />}>
        <IndustriesSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <TrustedLogosMarquee logos={trustedLogos} />
        </motion.div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <FeaturesSection features={features} />
        </motion.div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <KpiTrendsCard data={trendData} />
        </motion.div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <BenefitsSection handleGetStarted={handleGetStarted} />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <DemoVideoCarousel
          open={demoOpen}
          onOpenChange={setDemoOpen}
          onSelectTier={handleDemoTierSelect}
        />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection testimonials={testimonials} />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <LandingPricing tiers={tiers} openUpgrade={openUpgrade} />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <LandingCTA openUpgrade={openUpgrade} isLoading={isLoading} />
      </Suspense>

      <LandingFooter />

      <LandingChat />
    </motion.div>
  );
}