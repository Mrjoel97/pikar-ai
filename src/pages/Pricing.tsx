import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";

type Plan = {
  key: "solopreneur" | "startup" | "sme" | "enterprise";
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: Array<Plan> = [
  {
    key: "solopreneur",
    name: "Solopreneur",
    price: "$0",
    blurb: "Get started quickly with a personal AI assistant and core workflows.",
    features: [
      "Core dashboard & KPIs",
      "Today's Focus (max 3 tasks)",
      "Basic workflow templates",
      "Email test sends",
    ],
    cta: "Start Free",
  },
  {
    key: "startup",
    name: "Startup",
    price: "$49/mo",
    blurb: "Collaborate with a small team, approvals, and basic governance.",
    features: [
      "Team approvals & SLA basics",
      "Email campaigns & lists",
      "Phase 0 Diagnostics",
      "Template library (tier-focused)",
    ],
    cta: "Choose Startup",
    highlight: true,
  },
  {
    key: "sme",
    name: "SME",
    price: "$199/mo",
    blurb: "Deeper governance, SLA summaries, and compliance checklists.",
    features: [
      "Governance policy checks",
      "SLA summary & nudges",
      "Feature flags management",
      "Advanced analytics snapshots",
    ],
    cta: "Choose SME",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    blurb: "Scale with full governance, diagnostics, and feature control.",
    features: [
      "Enterprise diagnostics",
      "Strict governance enforcement",
      "Advanced approvals & SLAs",
      "Custom feature-flag rollouts",
    ],
    cta: "Contact Sales",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Choose your plan</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Flexible tiers that grow with you. Upgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={plan.highlight ? "border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" : ""}
            >
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  {plan.highlight && <Badge className="bg-emerald-600">Popular</Badge>}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-semibold">{plan.price}</div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.blurb}</p>
                </div>

                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {plan.key === "enterprise" ? (
                    <Link to="/business">
                      <Button className="w-full">{plan.cta}</Button>
                    </Link>
                  ) : (
                    <Link to="/auth">
                      <Button variant={plan.highlight ? "default" : "outline"} className="w-full">
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10 md:mt-14">
          <p className="text-xs md:text-sm text-muted-foreground">
            Need help choosing?{" "}
            <Link to="/" className="text-emerald-600 hover:underline">
              Explore the landing page
            </Link>{" "}
            or{" "}
            <Link to="/business" className="text-emerald-600 hover:underline">
              set up your business
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
