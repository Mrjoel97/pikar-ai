import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Step = "account" | "business" | "tier" | "payment" | "confirm";

export default function Onboarding() {
  const navigate = useNavigate();

  // Server status drives the initial step and resumability
  const status = useQuery(api.onboarding.getOnboardingStatus, {});
  const initialStep: Step = useMemo(() => {
    if (!status) return "account";
    if (!status.needsOnboarding) return "confirm";
    return (status.nextStep as Step) ?? "account";
  }, [status]);

  // Local stepper state
  const [step, setStep] = useState<Step>("account");
  useEffect(() => setStep(initialStep), [initialStep]);

  // Form state
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [website, setWebsite] = useState("");
  const [goalsText, setGoalsText] = useState("");
  const [tier, setTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise" | "">("");

  // Mutations/Actions
  const saveAccount = useMutation(api.onboarding.upsertAccountBasics);
  const saveBusiness = useMutation(api.onboarding.upsertBusinessBasics);
  const selectTier = useMutation(api.onboarding.selectTier);
  const finalize = useMutation(api.onboarding.finalizeOnboarding);
  const startCheckout = useAction(api.billing.startCheckout);
  const handleCheckoutSuccess = useAction(api.billing.handleCheckoutSuccess);

  // Loading flags
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    const tierParam = url.searchParams.get("tier");
    if (sessionId) {
      (async () => {
        try {
          await handleCheckoutSuccess({ sessionId });
          toast.success("Payment confirmed. Plan activated.");
          // Clean URL
          url.searchParams.delete("session_id");
          url.searchParams.delete("tier");
          window.history.replaceState({}, "", url.toString());
          // Move to confirm step
          setStep("confirm");
        } catch (e) {
          console.error(e);
          toast.error("We couldn't confirm your payment. You can continue without payment or try again.");
        }
      })();
    }
  }, [handleCheckoutSuccess]);

  const nextFromAccount = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsSaving(true);
    try {
      await saveAccount({ name: name.trim() });
      toast.success("Saved account basics");
      setStep("business");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save account basics");
    } finally {
      setIsSaving(false);
    }
  };

  const nextFromBusiness = async () => {
    if (!companyName.trim() || !industry.trim()) {
      toast.error("Company name and industry are required");
      return;
    }
    setIsSaving(true);
    try {
      const goals = goalsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await saveBusiness({
        name: companyName.trim(),
        industry: industry.trim(),
        size: size || undefined,
        website: website || undefined,
        goals,
      });
      toast.success("Saved business basics");
      setStep("tier");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save business basics");
    } finally {
      setIsSaving(false);
    }
  };

  const nextFromTier = async () => {
    if (!tier) {
      toast.error("Please choose a tier");
      return;
    }
    setIsSaving(true);
    try {
      await selectTier({ tier });
      toast.success("Tier selected");
      // For Phase 1, Payment is a lightweight step; allow skipping checkout for now
      setStep("payment");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save tier");
    } finally {
      setIsSaving(false);
    }
  };

  const goCheckout = async () => {
    if (!tier) {
      toast.error("Please choose a tier first");
      return;
    }
    setIsSaving(true);
    try {
      const { checkoutUrl } = await startCheckout({ tier });
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error(e);
      toast.error("Failed to start checkout");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAndFinish = async () => {
    setIsSaving(true);
    try {
      await finalize({});
      toast.success("All set! Redirecting to your dashboard...");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      toast.error("Failed to finalize onboarding");
    } finally {
      setIsSaving(false);
    }
  };

  const renderAccount = () => (
    <div className="space-y-4">
      <div>
        <Label>Your name</Label>
        <Input
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="neu-inset rounded-xl mt-1"
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button className="neu-raised rounded-xl" onClick={nextFromAccount} disabled={isSaving}>
          Continue
        </Button>
        <Button variant="outline" className="neu-flat rounded-xl" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );

  const renderBusiness = () => (
    <div className="space-y-4">
      <div>
        <Label>Company name</Label>
        <Input
          placeholder="Acme Inc."
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="neu-inset rounded-xl mt-1"
          disabled={isSaving}
        />
      </div>
      <div>
        <Label>Industry</Label>
        <Input
          placeholder="Software"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="neu-inset rounded-xl mt-1"
          disabled={isSaving}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Company size</Label>
          <Input
            placeholder="1-10"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="neu-inset rounded-xl mt-1"
            disabled={isSaving}
          />
        </div>
        <div>
          <Label>Website</Label>
          <Input
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="neu-inset rounded-xl mt-1"
            disabled={isSaving}
          />
        </div>
      </div>
      <div>
        <Label>Goals (comma-separated)</Label>
        <Input
          placeholder="Grow subscribers, Improve retention"
          value={goalsText}
          onChange={(e) => setGoalsText(e.target.value)}
          className="neu-inset rounded-xl mt-1"
          disabled={isSaving}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="neu-flat rounded-xl" onClick={() => setStep("account")} disabled={isSaving}>
          Back
        </Button>
        <Button className="neu-raised rounded-xl" onClick={nextFromBusiness} disabled={isSaving}>
          Continue
        </Button>
      </div>
    </div>
  );

  const renderTier = () => (
    <div className="space-y-4">
      <RadioGroup
        value={tier}
        onValueChange={(v) =>
          setTier(v as "solopreneur" | "startup" | "sme" | "enterprise")
        }
        className="grid grid-cols-1 gap-3"
      >
        <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
          <RadioGroupItem id="t1" value="solopreneur" />
          <Label htmlFor="t1" className="cursor-pointer">
            Solopreneur — $99/mo
          </Label>
        </div>
        <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
          <RadioGroupItem id="t2" value="startup" />
          <Label htmlFor="t2" className="cursor-pointer">
            Startup — $297/mo
          </Label>
        </div>
        <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
          <RadioGroupItem id="t3" value="sme" />
          <Label htmlFor="t3" className="cursor-pointer">
            SME — $597/mo
          </Label>
        </div>
        <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
          <RadioGroupItem id="t4" value="enterprise" />
          <Label htmlFor="t4" className="cursor-pointer">
            Enterprise — Custom
          </Label>
        </div>
      </RadioGroup>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="neu-flat rounded-xl" onClick={() => setStep("business")} disabled={isSaving}>
          Back
        </Button>
        <Button className="neu-raised rounded-xl" onClick={nextFromTier} disabled={isSaving || !tier}>
          Continue
        </Button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Proceed to secure checkout to activate your {tier || "selected"} plan. You can also continue now and complete payment later.
      </p>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="neu-flat rounded-xl" onClick={() => setStep("tier")} disabled={isSaving}>
          Back
        </Button>
        <Button className="neu-raised rounded-xl" onClick={goCheckout} disabled={isSaving || !tier}>
          Proceed to checkout
        </Button>
        <Button className="neu-raised rounded-xl" onClick={() => setStep("confirm")} disabled={isSaving}>
          Continue without payment
        </Button>
      </div>
    </div>
  );

  const renderConfirm = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Finalize your setup. We'll ensure your workspace and initiative are ready.
      </p>
      <div className="flex gap-2 pt-2">
        {status?.needsOnboarding ? (
          <>
            <Button variant="outline" className="neu-flat rounded-xl" onClick={() => setStep("payment")} disabled={isSaving}>
              Back
            </Button>
            <Button className="neu-raised rounded-xl" onClick={confirmAndFinish} disabled={isSaving}>
              Finish and go to Dashboard
            </Button>
          </>
        ) : (
          <>
            <Button className="neu-raised rounded-xl" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button variant="outline" className="neu-flat rounded-xl" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/5 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Card className="neu-raised rounded-2xl border-0">
          <CardContent className="p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Pikar AI</h1>
              <p className="text-muted-foreground">
                Complete a few quick steps. You can adjust these later in Business or Workflows.
              </p>
            </div>

            {/* Simple step indicator */}
            <div className="flex gap-2 text-xs text-muted-foreground">
              {["account", "business", "tier", "payment", "confirm"].map((s) => (
                <div
                  key={s}
                  className={`px-2 py-1 rounded-full ${
                    step === s ? "bg-primary/10 text-primary" : "bg-muted"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>

            {step === "account" && renderAccount()}
            {step === "business" && renderBusiness()}
            {step === "tier" && renderTier()}
            {step === "payment" && renderPayment()}
            {step === "confirm" && renderConfirm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}