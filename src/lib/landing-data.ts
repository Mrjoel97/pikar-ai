import { Brain, BarChart3, Zap, Shield, Users, DollarSign, User, Building, Building2 } from "lucide-react";

export const industries = [
  "SaaS", "eCommerce", "Healthcare", "Fintech", "Education", "Real Estate",
  "Logistics", "Hospitality", "Manufacturing", "Agencies", "Nonprofit",
  "Retail", "Media", "Gaming", "Legal", "HR Tech", "Travel",
  "Fitness & Wellness", "Consumer Apps", "Marketplaces",
];

export const benefitsData = [
  {
    icon: Zap,
    title: "10x Faster Execution",
    description: "Automate repetitive tasks and workflows, freeing up 15+ hours per week to focus on strategic growth initiatives."
  },
  {
    icon: BarChart3,
    title: "Data-Driven Insights",
    description: "Real-time analytics and predictive intelligence help you make informed decisions that drive 3x revenue growth."
  },
  {
    icon: Brain,
    title: "AI-Powered Agents",
    description: "Deploy specialized AI agents for content creation, customer support, sales, and marketing—working 24/7 for you."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption, 95%+ compliance automation, and SOC 2 certified infrastructure protect your business data."
  },
  {
    icon: Users,
    title: "Seamless Collaboration",
    description: "Unite your team with integrated workflows, real-time updates, and AI-assisted coordination across all departments."
  },
  {
    icon: DollarSign,
    title: "Proven ROI",
    description: "Average 340% ROI in 4 months. Our customers save $50K+ annually while increasing revenue by 200%+."
  }
];

export const demoTierDefaults = [
  {
    id: "solopreneur",
    name: "Solopreneur",
    icon: User,
    color: "bg-blue-500",
    defaultVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    defaultThumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop",
    defaultDuration: "3:45",
    description: "See how solo entrepreneurs automate their entire business workflow",
    benefits: [
      "One-click campaign setup",
      "AI content generation",
      "Automated social posting",
      "Lead capture & follow-up"
    ]
  },
  {
    id: "startup",
    name: "Startup",
    icon: Users,
    color: "bg-green-500",
    defaultVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    defaultThumbnail: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=450&fit=crop",
    defaultDuration: "5:20",
    description: "Watch how growing teams coordinate and scale with AI agents",
    benefits: [
      "Team collaboration tools",
      "Multi-channel campaigns",
      "Advanced analytics",
      "Workflow automation"
    ]
  },
  {
    id: "sme",
    name: "SME",
    icon: Building,
    color: "bg-purple-500",
    defaultVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    defaultThumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop",
    defaultDuration: "6:15",
    description: "Discover enterprise-grade orchestration for mid-sized businesses",
    benefits: [
      "Department-level dashboards",
      "Compliance automation",
      "Multi-brand management",
      "Custom AI agents"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    color: "bg-orange-500",
    defaultVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    defaultThumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop",
    defaultDuration: "8:30",
    description: "Experience global business transformation at scale",
    benefits: [
      "White-label capabilities",
      "Custom API access",
      "SSO & SCIM integration",
      "Dedicated support"
    ]
  }
];

export const trendData = [
  { month: "Jan", revenue: 12000, leads: 240, efficiency: 80 },
  { month: "Feb", revenue: 13500, leads: 260, efficiency: 82 },
  { month: "Mar", revenue: 15000, leads: 300, efficiency: 84 },
  { month: "Apr", revenue: 16200, leads: 320, efficiency: 86 },
  { month: "May", revenue: 17500, leads: 340, efficiency: 87 },
  { month: "Jun", revenue: 19000, leads: 360, efficiency: 89 },
];

export const features = [
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

export const tiers = [
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

export const trustedLogos = [
  { name: "Stripe", src: "https://cdn.simpleicons.org/stripe" },
  { name: "Google", src: "https://cdn.simpleicons.org/google" },
  { name: "Slack", src: "https://cdn.simpleicons.org/slack" },
  { name: "Notion", src: "https://cdn.simpleicons.org/notion" },
  { name: "HubSpot", src: "https://cdn.simpleicons.org/hubspot" },
  { name: "Salesforce", src: "https://cdn.simpleicons.org/salesforce" },
  { name: "Shopify", src: "https://cdn.simpleicons.org/shopify" },
];

export const testimonials = [
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