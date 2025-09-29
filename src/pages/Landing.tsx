import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
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
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TrustedLogosMarquee from "@/components/landing/TrustedLogosMarquee";
import FeaturesSection from "@/components/landing/FeaturesSection";
import KpiTrendsCard from "@/components/landing/KpiTrendsCard";
import ContextualTipsStrip from "@/components/landing/ContextualTipsStrip";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useMemo } from "react";
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

// Memoize presentational sections to prevent unnecessary re-renders
const MemoTrustedLogosMarquee = React.memo(TrustedLogosMarquee);
const MemoFeaturesSection = React.memo(FeaturesSection);
const MemoKpiTrendsCard = React.memo(KpiTrendsCard);
const MemoContextualTipsStrip = React.memo(ContextualTipsStrip);

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise">("startup");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

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
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
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
    if (isAuthenticated) {
      navigate(`/dashboard?tier=${selectedTier}`);
    } else {
      navigate(`/auth?tier=${selectedTier}`);
    }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Reduce navbar height on mobile for better fit */}
          <div className="flex justify-between items-center h-14 sm:h-16">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="neu-raised rounded-xl p-2 bg-primary/10">
                {/* Slightly smaller icon on mobile to avoid wrap */}
                <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">Pikar AI</span>
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
                onClick={() => scrollTo("docs")}
                aria-label="View Docs"
              >
                Docs
              </button>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                className="neu-flat rounded-xl bg-card/70 hover:bg-card text-foreground"
                onClick={() => navigate("/auth")}
                aria-label="Sign in"
              >
                Sign In
              </Button>
              <Button
                className="neu-raised rounded-xl bg-primary hover:bg-primary/90"
                onClick={handleGetStarted}
                disabled={isLoading}
                aria-label="Get started"
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "Get Started"
                )}
              </Button>
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
                          setTimeout(() => scrollTo("docs"), 50);
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
                        aria-label="Sign in"
                      >
                        Sign In
                      </Button>
                      <Button
                        className="w-full neu-raised rounded-xl bg-[#1B5235] hover:bg-[#17452D] text-white"
                        onClick={() => {
                          setMobileOpen(false);
                          handleGetStarted();
                        }}
                        disabled={isLoading}
                        aria-label="Get started"
                      >
                        {isLoading ? (
                          <span className="inline-flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          "Get Started"
                        )}
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
        {/* Subtle white gradient overlay */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.95),rgba(255,255,255,0.9)_45%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8 neu-inset">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">AI-Powered Business Intelligence</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.15] sm:leading-[1.1]">
              <span className="text-foreground">Transform Your Business</span>
              <br />
              <span className="text-primary">and Ideas</span> <span className="text-foreground">with AI</span>
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-1">
              Pikar AI helps entrepreneurs and businesses evaluate ideas, diagnose problems,
              and integrate with ERP systems using cutting-edge artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                size="lg"
                className="w-full sm:w-auto neu-raised rounded-xl bg-primary hover:bg-primary/90 px-8 py-4 text-lg"
                onClick={handleGetStarted}
                disabled={isLoading}
                aria-label="Start free assessment"
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>
                    Start Free Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto neu-flat rounded-xl px-8 py-4 text-lg"
                variant="outline"
                onClick={() => setDemoOpen(true)}
                aria-label="Watch demo"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="neu-inset rounded-xl px-4 py-3 sm:px-5 sm:py-4 bg-card/70 text-center"
              >
                <div className="text-lg sm:text-2xl font-bold text-black">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Traction Industries (randomized) */}
      <section className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-xs sm:text-sm text-muted-foreground tracking-wide">
              High‑Traction Industries We Support
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {randomIndustries.map((ind) => (
              <Badge
                key={ind}
                variant="secondary"
                className="neu-inset rounded-full px-3 py-1.5 bg-card/70"
              >
                {ind}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <MemoTrustedLogosMarquee logos={trustedLogos} />

      <MemoFeaturesSection features={features} />

      <MemoKpiTrendsCard data={trendData} />

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
                    <Button 
                      className="w-full neu-flat rounded-xl"
                      variant={index === 1 ? "default" : "outline"}
                      onClick={() => openUpgrade(tier.name)}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Target className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using Pikar AI to automate operations, boost productivity, and accelerate growth.
            </p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto neu-raised rounded-xl bg-primary hover:bg-primary/90 px-8 py-4 text-lg"
              onClick={() => openUpgrade()}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                <>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 sm:pt-16 border-t border-border/50">
        {/* Newsletter Bar */}
        <div className="px-4 sm:px-6 lg:px-8">
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
                  <Button
                    type="submit"
                    className="neu-raised rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={newsletterSubmitting}
                  >
                    {newsletterSubmitting ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subscribing...
                      </span>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Base */}
        <div className="px-4 sm:px-6 lg:px-8">
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
        </div>
      </footer>
    </motion.div>
  );
}