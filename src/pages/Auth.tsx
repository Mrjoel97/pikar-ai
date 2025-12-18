import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { motion } from "framer-motion";
import { CheckCircle2, Shield, Zap, Users, TrendingUp, Star } from "lucide-react";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth = "/dashboard" }: AuthProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const onboardingStatus = useQuery(
    api.onboarding.getOnboardingStatus,
    isAuthenticated ? {} : undefined
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (onboardingStatus === undefined) return;

    if (onboardingStatus?.needsOnboarding) {
      navigate("/onboarding");
      return;
    }

    navigate(redirectAfterAuth);
  }, [isAuthenticated, authLoading, onboardingStatus, navigate, redirectAfterAuth]);

  const features = [
    {
      icon: Zap,
      title: "Get Started in 60 Seconds",
      description: "No credit card required. Start automating immediately."
    },
    {
      icon: Users,
      title: "Join 10,000+ Users",
      description: "Trusted by solopreneurs to enterprises worldwide."
    },
    {
      icon: TrendingUp,
      title: "Save 15+ Hours/Week",
      description: "Automate workflows and focus on what matters."
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Bank-level encryption and SOC 2 compliant."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Founder, TechFlow",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      quote: "Pikar AI saved me 20 hours per week. Best decision for my business.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Operations Director",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      quote: "The automation capabilities are incredible. ROI in just 2 months.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Marketing Lead",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      quote: "Our team productivity tripled. Can't imagine working without it.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Value Proposition & Social Proof */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10">
          {/* Logo & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-3">
              Welcome to Pikar AI
            </h1>
            <p className="text-emerald-100 text-lg">
              Your AI-powered business automation platform
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="space-y-6 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-emerald-100 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6 flex-wrap"
          >
            <div className="flex items-center gap-2 text-white/90">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">SOC 2 Certified</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">256-bit Encryption</span>
            </div>
          </motion.div>
        </div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="relative z-10"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <img
                src={testimonials[0].image}
                alt={testimonials[0].name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonials[0].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white text-sm mb-3 italic">
                  "{testimonials[0].quote}"
                </p>
                <div>
                  <p className="text-white font-semibold text-sm">{testimonials[0].name}</p>
                  <p className="text-emerald-200 text-xs">{testimonials[0].role}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-10 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Pikar AI
            </h2>
            <p className="text-gray-600">
              Join 10,000+ users automating their business
            </p>
          </div>

          {/* Auth Container */}
          <AuthContainer />

          {/* Additional Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-600 mb-4">
              Trusted by leading companies worldwide
            </p>
            <div className="flex items-center justify-center gap-6 opacity-60">
              <img src="https://cdn.simpleicons.org/google/1A73E8" alt="Google" className="h-6" />
              <img src="https://cdn.simpleicons.org/stripe/0A2540" alt="Stripe" className="h-6" />
              <img src="https://cdn.simpleicons.org/slack/4A154B" alt="Slack" className="h-6" />
              <img src="https://cdn.simpleicons.org/salesforce/00A1E0" alt="Salesforce" className="h-6" />
            </div>
          </motion.div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 space-y-4">
            {features.slice(0, 2).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-sm">{feature.title}</h3>
                  <p className="text-gray-600 text-xs">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Auth {...props} />;
}