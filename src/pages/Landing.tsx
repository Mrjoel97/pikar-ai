import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

// Refined smooth transition variants for consistent animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const fadeInUpFast = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerContainerFast = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};
import { 
  ArrowRight, 
  Brain, 
  BarChart3, 
  Zap, 
  Shield, 
  Users, 
  Target,
  Sparkles,
  CheckCircle,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import React from "react";

// Add static KPI trend data used by KpiTrendsCard
const trendData: Array<{ month: string; revenue: number; leads: number; efficiency: number }> = [
  { month: "Jan", revenue: 12000, leads: 240, efficiency: 80 },
  { month: "Feb", revenue: 13500, leads: 260, efficiency: 82 },
  { month: "Mar", revenue: 15000, leads: 300, efficiency: 84 },
  { month: "Apr", revenue: 16200, leads: 320, efficiency: 86 },
  { month: "May", revenue: 17500, leads: 340, efficiency: 87 },
  { month: "Jun", revenue: 19000, leads: 360, efficiency: 89 },
];

// Lazy-load presentational sections for code-splitting
const TrustedLogosMarquee = React.lazy(() => import("@/components/landing/TrustedLogosMarquee"));
const FeaturesSection = React.lazy(() => import("@/components/landing/FeaturesSection"));
const KpiTrendsCard = React.lazy(() => import("@/components/landing/KpiTrendsCard"));
const ContextualTipsStrip = React.lazy(() => import("@/components/landing/ContextualTipsStrip"));
const DemoVideoCarousel = React.lazy(() => import("@/components/landing/DemoVideoCarousel"));

export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise">("startup");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isLoading] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const heroStats = [
    { label: "Active Users", value: "8.2k+" },
    { label: "Avg. ROI Increase", value: "34%" },
    { label: "Workflows Automated", value: "12k+" },
    { label: "Avg. Setup Time", value: "7m" },
  ];

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
    { name: "Slack", src: "https://cdn.simpleicons.org/slack/4A154B" },
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

  const proceedUpgrade = () => {
    toast(`Selected ${selectedTier} plan`);
    navigate(`/dashboard?tier=${selectedTier}`);
  };

  const handleDemoTierSelect = (tier: string) => {
    setSelectedTier(normalizeTier(tier));
    navigate(`/dashboard?tier=${tier}`);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: "user", content: chatInput }]);
    setChatInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm here to help! This is a demo response. In production, this would connect to your AI backend." }
      ]);
    }, 1000);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      toast("Please enter a valid email address.");
      return;
    }
    try {
      setNewsletterSubmitting(true);
      // Simulate local subscription without backend to avoid Convex dependency on Landing
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast(`Subscribed with ${email}. Welcome to Pikar AI!`);
      setNewsletterEmail("");
    } catch (err: any) {
      toast(err?.message || "Subscription failed. Please try again later.");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const industries: Array<string> = [
    "SaaS",
    "eCommerce",
    "Healthcare",
    "Fintech",
    "Education",
    "Real Estate",
    "Logistics",
    "Hospitality",
    "Manufacturing",
    "Agencies",
    "Nonprofit",
    "Retail",
    "Media",
    "Gaming",
    "Legal",
    "HR Tech",
    "Travel",
    "Fitness & Wellness",
    "Consumer Apps",
    "Marketplaces",
  ];
  const randomIndustries = useMemo(() => {
    const shuffled = [...industries].sort(() => Math.random() - 0.5);
    // Show all industries randomized
    return shuffled;
  }, []);

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

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
              <motion.div 
                className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="neu-raised rounded-xl p-1.5 sm:p-2 bg-primary/10">
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <span className="text-base sm:text-xl font-bold tracking-tight">Pikar AI</span>
              </motion.div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => navigate("/")}
                aria-label="Go to Home"
              >
                Home
              </button>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => scrollTo("features")}
                aria-label="View Features"
              >
                Features
              </button>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => scrollTo("pricing")}
                aria-label="View Pricing"
              >
                Pricing
              </button>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => navigate("/docs")}
                aria-label="View Docs"
              >
                Docs
              </button>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="neu-flat rounded-xl bg-card/70 hover:bg-card text-foreground"
                  onClick={() => navigate("/auth")}
                  aria-label="Sign in"
                >
                  Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="neu-raised rounded-xl bg-primary hover:bg-primary/90"
                        onClick={handleGetStarted}
                        aria-label="Get started"
                      >
                        Get Started
                </Button>
              </motion.div>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="neu-flat rounded-xl"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[92vw] sm:w-96 max-w-sm">
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="neu-raised rounded-xl p-2 bg-primary/10">
                        <Brain className="h-7 w-7 text-primary" />
                      </div>
                      <span className="text-lg font-semibold">Pikar AI</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setMobileOpen(false);
                          navigate("/");
                        }}
                        aria-label="Go to Home"
                      >
                        Home
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setMobileOpen(false);
                          setTimeout(() => scrollTo("features"), 50);
                        }}
                        aria-label="View Features"
                      >
                        Features
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setMobileOpen(false);
                          setTimeout(() => scrollTo("pricing"), 50);
                        }}
                        aria-label="View Pricing"
                      >
                        Pricing
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setMobileOpen(false);
                          navigate("/docs");
                        }}
                        aria-label="View Docs"
                      >
                        Docs
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 space-y-3">
                      <Button
                        className="w-full neu-flat rounded-xl bg-card/70 hover:bg-card text-foreground"
                        onClick={() => {
                          setMobileOpen(false);
                          navigate("/auth");
                        }}
                        disabled={isLoading}
                        aria-label="Sign in"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                      <Button
                        className="w-full neu-raised rounded-xl bg-[#1B5235] hover:bg-[#17452D] text-white"
                        onClick={() => {
                          setMobileOpen(false);
                          handleGetStarted();
                        }}
                        aria-label="Get started"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="main"
        className="relative pt-5 pb-12 sm:pt-10 sm:pb-20 lg:pt-10 lg:pb-24 px-4 sm:px-6 lg:px-8"
      >
        {/* Static gradient overlay */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.95),rgba(255,255,255,0.9)_45%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8 neu-inset"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Business Intelligence</span>
            </motion.div>
            
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.15] sm:leading-[1.1]"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-foreground"
              >
                Transform Your Business
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-primary"
              >
                and Ideas
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="text-foreground"
              >
                with AI
              </motion.span>
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-1"
            >
              Pikar AI helps entrepreneurs and businesses evaluate ideas, diagnose problems,
              and integrate with ERP systems using cutting-edge artificial intelligence.
            </motion.p>
            
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.7 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto neu-raised rounded-xl bg-primary hover:bg-primary/90 px-8 py-4 text-lg"
                  onClick={handleGetStarted}
                  aria-label="Start free assessment"
                >
                  Start Free Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.9 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto neu-flat rounded-xl px-8 py-4 text-lg"
                  variant="outline"
                  onClick={() => setDemoOpen(true)}
                  aria-label="Watch demo"
                >
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          className="mt-8 sm:mt-10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="neu-inset rounded-xl px-4 py-3 sm:px-5 sm:py-4 bg-card/70 text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-lg sm:text-2xl font-bold text-black">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* High-Traction Industries (randomized) */}
      <motion.section 
        className="px-4 sm:px-6 lg:px-8 pb-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-4"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-xs sm:text-sm text-muted-foreground tracking-wide">
              High‑Traction Industries We Support
            </p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
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
                  className="neu-inset rounded-full px-3 py-1.5 bg-card/70"
                >
                  {ind}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Trusted Logos - Animated Marquee */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <React.Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 text-sm text-muted-foreground">Loading logos…</div>}>
          <TrustedLogosMarquee logos={trustedLogos} />
        </React.Suspense>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <React.Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 text-sm text-muted-foreground">Loading features…</div>}>
          <FeaturesSection features={features} />
        </React.Suspense>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <React.Suspense fallback={<div className="px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-sm text-muted-foreground">Loading KPI trends…</div>}>
          <KpiTrendsCard data={trendData} />
        </React.Suspense>
      </motion.div>

      {/* Demo Video Carousel */}
      <React.Suspense fallback={null}>
        <DemoVideoCarousel
          open={demoOpen}
          onOpenChange={setDemoOpen}
          onSelectTier={handleDemoTierSelect}
        />
      </React.Suspense>

      {/* Testimonials Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5 relative overflow-hidden">
        {/* Floating background elements */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
          animate={{
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4 neu-inset">
                <Users className="h-3 w-3 mr-1" />
                Trusted by 8,200+ Businesses
              </Badge>
            </motion.div>
            <motion.h2
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Real Results from Real People
            </motion.h2>
            <motion.p
              className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              See how businesses across industries are transforming with Pikar AI
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
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
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                whileInView={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="neu-raised rounded-2xl border-0 h-full hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                  {/* Animated gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-primary/0 group-hover:from-emerald-500/5 group-hover:to-primary/5 transition-all duration-500"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  />
                  <CardContent className="p-6 relative z-10">
                    <motion.div 
                      className="flex items-start gap-4 mb-4"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.2 }}
                      viewport={{ once: true }}
                    >
                      <motion.img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover neu-raised"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&size=400&background=random`;
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.15 + 0.4 }}
                        viewport={{ once: true }}
                      >
                        <Badge variant="outline" className="neu-inset text-xs">
                          {testimonial.tier}
                        </Badge>
                      </motion.div>
                    </motion.div>
                    
                    <motion.p 
                      className="text-sm text-foreground leading-relaxed mb-3"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.15 + 0.3 }}
                      viewport={{ once: true }}
                    >
                      "{testimonial.quote}"
                    </motion.p>
                    
                    <motion.div 
                      className="flex items-center gap-2 pt-3 border-t border-border/50"
                      initial={{ y: 10, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.5 }}
                      viewport={{ once: true }}
                    >
                      <Badge variant="secondary" className="text-xs neu-inset">
                        {testimonial.industry}
                      </Badge>
                      <div className="flex gap-0.5 ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.span 
                            key={star} 
                            className="text-amber-500 text-sm"
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            transition={{ 
                              duration: 0.4, 
                              delay: index * 0.15 + 0.6 + (star * 0.05),
                              type: "spring",
                              stiffness: 200
                            }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.3, rotate: 15 }}
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
              {[
                { icon: CheckCircle, text: "4.9/5 Average Rating" },
                { icon: CheckCircle, text: "95% Customer Satisfaction" },
                { icon: CheckCircle, text: "12k+ Workflows Automated" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  className="flex items-center gap-2"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.6 + (idx * 0.1),
                    type: "spring",
                    stiffness: 150
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <item.icon className="h-5 w-5 text-emerald-600" />
                  </motion.div>
                  <span className="text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
              Choose Your Growth Path
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              From solopreneurs to enterprises, we have the perfect plan for your business size
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`neu-raised rounded-2xl border-0 h-full ${index === 1 ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-6">
                    {index === 1 && (
                      <div className="text-center mb-4">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                      <div className="text-3xl font-bold text-primary mb-2">{tier.price}</div>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button 
                        className="w-full neu-flat rounded-xl"
                        variant={index === 1 ? "default" : "outline"}
                        onClick={() => openUpgrade(tier.name)}
                      >
                        Get Started
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <motion.footer 
        className="pt-12 sm:pt-16 border-t border-border/50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Newsletter Bar */}
        <motion.div 
          className="px-4 sm:px-6 lg:px-8"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="max-w-5xl mx-auto neu-raised rounded-2xl bg-card/70 p-5 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">Stay in the loop</h3>
                <p className="text-sm text-muted-foreground">
                  Get product updates, tutorials, and tips. No spam—unsubscribe anytime.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="w-full md:w-auto flex-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="neu-inset rounded-xl pl-9 focus-visible:ring-2 focus-visible:ring-primary/50"
                      aria-label="Email address"
                    />
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="submit"
                      className="neu-raised rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={newsletterSubmitting || isLoading}
                    >
                      {newsletterSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Footer Base */}
        <motion.div 
          className="px-4 sm:px-6 lg:px-8"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto py-10 sm:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="neu-raised rounded-xl p-2">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-lg font-semibold">Pikar AI</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Empowering businesses with intelligent automation.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Product</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><button className="hover:text-foreground transition-colors">Features</button></li>
                  <li><button className="hover:text-foreground transition-colors">Pricing</button></li>
                  <li><button className="hover:text-foreground transition-colors">Docs</button></li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Company</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><button className="hover:text-foreground transition-colors">About</button></li>
                  <li><button className="hover:text-foreground transition-colors">Blog</button></li>
                  <li><button className="hover:text-foreground transition-colors">Contact</button></li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Resources</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><button className="hover:text-foreground transition-colors">Help Center</button></li>
                  <li><button className="hover:text-foreground transition-colors">Guides</button></li>
                  <li><button className="hover:text-foreground transition-colors">Status</button></li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50 pt-6">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Pikar AI. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground">
                Built with ❤️ by{" "}
                <a
                  href="https://vly.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  vly.ai
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.footer>

      {/* AI Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        {aiChatOpen ? (
          <Card className="w-96 h-[500px] flex flex-col shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="sm" onClick={() => setAiChatOpen(false)}>✕</Button>
                </motion.div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleSendMessage}>Send</Button>
                </motion.div>
              </div>
            </div>
          </Card>
        ) : (
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }} 
            whileTap={{ scale: 0.9 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ 
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg"
              onClick={() => setAiChatOpen(true)}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}