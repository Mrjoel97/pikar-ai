import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface Variant {
  variantKey: string;
  name: string;
  subject: string;
  body: string;
  buttons: Array<{ text: string; url: string }>;
  trafficSplit: number;
}

interface ExperimentCreatorProps {
  businessId: Id<"businesses">;
  onComplete?: (experimentId: Id<"experiments">) => void;
  onCancel?: () => void;
}

export function ExperimentCreator({ businessId, onComplete, onCancel }: ExperimentCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [goal, setGoal] = useState<"opens" | "clicks" | "conversions">("opens");
  
  const [variants, setVariants] = useState<Variant[]>([
    { variantKey: "A", name: "Variant A", subject: "", body: "", buttons: [], trafficSplit: 50 },
    { variantKey: "B", name: "Variant B", subject: "", body: "", buttons: [], trafficSplit: 50 },
  ]);

  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [minimumSampleSize, setMinimumSampleSize] = useState(100);
  const [durationDays, setDurationDays] = useState(7);
  const [autoDeclareWinner, setAutoDeclareWinner] = useState(true);

  // Sample size calculator state
  const [baselineRate, setBaselineRate] = useState(5);
  const [minimumDetectableEffect, setMinimumDetectableEffect] = useState(20);
  const [statisticalPower, setStatisticalPower] = useState(80);
  const [showCalculator, setShowCalculator] = useState(false);

  const createExperiment = useMutation(api.experiments.createExperiment);
  const calculateSampleSize = useQuery(
    api.experiments.calculateSampleSize,
    showCalculator
      ? {
          baselineRate,
          minimumDetectableEffect,
          confidenceLevel,
          statisticalPower,
        }
      : "skip"
  );

  const addVariant = () => {
    if (variants.length >= 4) {
      toast.error("Maximum 4 variants allowed");
      return;
    }
    const keys = ["A", "B", "C", "D"];
    const nextKey = keys[variants.length];
    const newSplit = Math.floor(100 / (variants.length + 1));
    const updatedVariants = variants.map(v => ({ ...v, trafficSplit: newSplit }));
    updatedVariants.push({
      variantKey: nextKey,
      name: `Variant ${nextKey}`,
      subject: "",
      body: "",
      buttons: [],
      trafficSplit: newSplit,
    });
    setVariants(updatedVariants);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      toast.error("Minimum 2 variants required");
      return;
    }
    const updated = variants.filter((_, i) => i !== index);
    const newSplit = Math.floor(100 / updated.length);
    setVariants(updated.map(v => ({ ...v, trafficSplit: newSplit })));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const updateTrafficSplit = (index: number, value: number) => {
    const updated = [...variants];
    updated[index].trafficSplit = value;
    
    // Adjust other variants to maintain 100% total
    const remaining = 100 - value;
    const otherCount = variants.length - 1;
    const splitPerOther = Math.floor(remaining / otherCount);
    
    updated.forEach((v, i) => {
      if (i !== index) {
        v.trafficSplit = splitPerOther;
      }
    });
    
    setVariants(updated);
  };

  const handleSubmit = async () => {
    try {
      const totalSplit = variants.reduce((sum, v) => sum + v.trafficSplit, 0);
      if (Math.abs(totalSplit - 100) > 0.01) {
        toast.error("Traffic splits must sum to 100%");
        return;
      }

      const experimentId = await createExperiment({
        businessId,
        name,
        hypothesis,
        goal,
        variants,
        configuration: {
          confidenceLevel,
          minimumSampleSize,
          durationDays,
          autoDeclareWinner,
        },
      });

      toast.success("Experiment created successfully!");
      onComplete?.(experimentId);
    } catch (error) {
      toast.error("Failed to create experiment");
      console.error(error);
    }
  };

  const totalSplit = variants.reduce((sum, v) => sum + v.trafficSplit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create A/B Test</h2>
          <p className="text-sm text-muted-foreground">Step {step} of 4</p>
        </div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Define your experiment's goal and hypothesis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Experiment Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Subject Line Test - Q1 2025"
              />
            </div>
            <div>
              <Label htmlFor="hypothesis">Hypothesis</Label>
              <Textarea
                id="hypothesis"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="e.g., A more personalized subject line will increase open rates by 15%"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="goal">Primary Goal</Label>
              <Select value={goal} onValueChange={(v: any) => setGoal(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opens">Opens</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setStep(2)} disabled={!name || !hypothesis}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Create your test variants (2-4 variants)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div key={variant.variantKey} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{variant.name}</h4>
                  {variants.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Subject Line</Label>
                  <Input
                    value={variant.subject}
                    onChange={(e) => updateVariant(index, "subject", e.target.value)}
                    placeholder="Enter subject line"
                  />
                </div>
                <div>
                  <Label>Email Body</Label>
                  <Textarea
                    value={variant.body}
                    onChange={(e) => updateVariant(index, "body", e.target.value)}
                    placeholder="Enter email content"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Traffic Split: {variant.trafficSplit}%</Label>
                  <Slider
                    value={[variant.trafficSplit]}
                    onValueChange={([v]) => updateTrafficSplit(index, v)}
                    min={10}
                    max={80}
                    step={5}
                  />
                </div>
              </div>
            ))}
            
            {variants.length < 4 && (
              <Button variant="outline" onClick={addVariant} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Total: {totalSplit}% {Math.abs(totalSplit - 100) > 0.01 && "(must equal 100%)"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={variants.some(v => !v.subject || !v.body) || Math.abs(totalSplit - 100) > 0.01}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistical Configuration</CardTitle>
            <CardDescription>Set parameters for statistical analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Confidence Level</Label>
                <Select value={String(confidenceLevel)} onValueChange={(v) => setConfidenceLevel(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90% (Less strict)</SelectItem>
                    <SelectItem value="95">95% (Recommended)</SelectItem>
                    <SelectItem value="99">99% (Very strict)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher confidence reduces false positives
                </p>
              </div>
              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  min={1}
                  max={30}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 7-14 days
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Sample Size Calculator</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalculator(!showCalculator)}
                >
                  {showCalculator ? "Hide" : "Show"} Calculator
                </Button>
              </div>

              {showCalculator && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="baselineRate">Baseline Conversion Rate (%)</Label>
                      <Input
                        id="baselineRate"
                        type="number"
                        value={baselineRate}
                        onChange={(e) => setBaselineRate(Number(e.target.value))}
                        min={0.1}
                        max={100}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mde">Minimum Detectable Effect (%)</Label>
                      <Input
                        id="mde"
                        type="number"
                        value={minimumDetectableEffect}
                        onChange={(e) => setMinimumDetectableEffect(Number(e.target.value))}
                        min={1}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="power">Statistical Power (%)</Label>
                      <Input
                        id="power"
                        type="number"
                        value={statisticalPower}
                        onChange={(e) => setStatisticalPower(Number(e.target.value))}
                        min={50}
                        max={99}
                      />
                    </div>
                  </div>

                  {calculateSampleSize && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <h5 className="font-semibold text-sm">Recommended Sample Size</h5>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Per Variant</p>
                          <p className="text-lg font-bold">{calculateSampleSize.sampleSizePerVariant}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="text-lg font-bold">{calculateSampleSize.totalSampleSize}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. Duration</p>
                          <p className="text-lg font-bold">{calculateSampleSize.estimatedDays} days</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMinimumSampleSize(calculateSampleSize.sampleSizePerVariant)}
                        className="w-full mt-2"
                      >
                        Use Recommended Sample Size
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="sampleSize">Minimum Sample Size (per variant)</Label>
              <Input
                id="sampleSize"
                type="number"
                value={minimumSampleSize}
                onChange={(e) => setMinimumSampleSize(Number(e.target.value))}
                min={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current: {minimumSampleSize} per variant ({minimumSampleSize * variants.length} total)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="autoDeclare">Auto-declare winner</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically end test when statistical significance is reached
                </p>
              </div>
              <Switch
                id="autoDeclare"
                checked={autoDeclareWinner}
                onCheckedChange={setAutoDeclareWinner}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Launch</CardTitle>
            <CardDescription>Confirm your experiment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Experiment Details</h4>
              <p className="text-sm"><strong>Name:</strong> {name}</p>
              <p className="text-sm"><strong>Goal:</strong> {goal}</p>
              <p className="text-sm"><strong>Variants:</strong> {variants.length}</p>
              <p className="text-sm"><strong>Duration:</strong> {durationDays} days</p>
              <p className="text-sm"><strong>Confidence:</strong> {confidenceLevel}%</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit}>
                Create Experiment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}