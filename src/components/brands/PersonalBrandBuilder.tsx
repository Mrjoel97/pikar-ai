import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import { BrandProfileTab } from "./builder/BrandProfileTab";
import { VisualIdentityTab } from "./builder/VisualIdentityTab";
import { VoiceToneTab } from "./builder/VoiceToneTab";
import { ContentGuidelinesTab } from "./builder/ContentGuidelinesTab";
import { BrandPreviewTab } from "./builder/BrandPreviewTab";

interface PersonalBrandBuilderProps {
  businessId: Id<"businesses">;
}

export function PersonalBrandBuilder({ businessId }: PersonalBrandBuilderProps) {
  const analyzeBrand = useAction(api.brandBuilder.analyzeBrand);
  const generateAssets = useAction(api.brandBuilder.generateBrandAssets);
  const saveBrandProfile = useAction(api.brandBuilder.saveBrandProfile);
  const getBrandInsights = useAction(api.brandBuilder.getBrandInsights);
  const suggestImprovements = useAction(api.brandBuilder.suggestImprovements);

  const [activeTab, setActiveTab] = useState("profile");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [generatedAssets, setGeneratedAssets] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);

  // Form state
  const [brandProfile, setBrandProfile] = useState({
    brandName: "",
    tagline: "",
    mission: "",
    vision: "",
    values: [] as string[],
    personality: [] as string[],
    industry: "",
    targetAudience: "",
    voiceTone: {
      formal: 50,
      friendly: 50,
      professional: 50,
      playful: 50,
    },
    visualIdentity: {
      primaryColor: "#2563eb",
      secondaryColor: "#3b82f6",
      accentColor: "#60a5fa",
      logoUrl: "",
      fonts: {
        heading: "Inter",
        body: "Inter",
      },
    },
    contentGuidelines: {
      writingStyle: "",
      keyMessages: [] as string[],
      dosList: [] as string[],
      dontsList: [] as string[],
    },
  });

  const [newValue, setNewValue] = useState("");
  const [newPersonality, setNewPersonality] = useState("");
  const [newKeyMessage, setNewKeyMessage] = useState("");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");

  const handleAnalyzeBrand = async () => {
    if (!brandProfile.brandName) {
      toast.error("Please enter a brand name first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeBrand({
        businessId,
        brandName: brandProfile.brandName,
        industry: brandProfile.industry,
        targetAudience: brandProfile.targetAudience,
        values: brandProfile.values,
      });
      setAnalysis(result);
      toast.success("Brand analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze brand");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAssets = async () => {
    if (!brandProfile.brandName || !brandProfile.industry) {
      toast.error("Please enter brand name and industry first");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateAssets({
        businessId,
        brandName: brandProfile.brandName,
        industry: brandProfile.industry,
      });
      setGeneratedAssets(result);
      toast.success("Brand assets generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate assets");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!brandProfile.brandName) {
      toast.error("Please enter a brand name");
      return;
    }

    try {
      await saveBrandProfile({
        businessId,
        profile: brandProfile,
      });
      toast.success("Brand profile saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save brand profile");
    }
  };

  const handleGetInsights = async () => {
    try {
      const result = await getBrandInsights({ businessId });
      setInsights(result);
      toast.success("Brand insights loaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to get insights");
    }
  };

  const handleGetSuggestions = async () => {
    try {
      const result = await suggestImprovements({
        businessId,
        currentBrand: {
          name: brandProfile.brandName,
          colors: [
            brandProfile.visualIdentity.primaryColor,
            brandProfile.visualIdentity.secondaryColor || "",
          ],
          fonts: [
            brandProfile.visualIdentity.fonts.heading,
            brandProfile.visualIdentity.fonts.body,
          ],
        },
      });
      setSuggestions(result);
      toast.success("Improvement suggestions generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to get suggestions");
    }
  };

  const applyColorPalette = (palette: any) => {
    setBrandProfile({
      ...brandProfile,
      visualIdentity: {
        ...brandProfile.visualIdentity,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
      },
    });
    toast.success(`Applied ${palette.name} color palette`);
  };

  const applyFontPairing = (fonts: any) => {
    setBrandProfile({
      ...brandProfile,
      visualIdentity: {
        ...brandProfile.visualIdentity,
        fonts: {
          heading: fonts.heading,
          body: fonts.body,
        },
      },
    });
    toast.success(`Applied ${fonts.style} font pairing`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personal Brand Builder</h2>
          <p className="text-muted-foreground">
            Create and refine your brand identity with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGetInsights}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Insights
          </Button>
          <Button onClick={handleSaveBrand}>
            <Save className="mr-2 h-4 w-4" />
            Save Brand
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="visual">Visual Identity</TabsTrigger>
          <TabsTrigger value="voice">Voice & Tone</TabsTrigger>
          <TabsTrigger value="content">Content Guide</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <BrandProfileTab
            brandProfile={brandProfile}
            setBrandProfile={setBrandProfile}
            newValue={newValue}
            setNewValue={setNewValue}
            newPersonality={newPersonality}
            setNewPersonality={setNewPersonality}
            isAnalyzing={isAnalyzing}
            analysis={analysis}
            onAnalyze={handleAnalyzeBrand}
          />
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <VisualIdentityTab
            brandProfile={brandProfile}
            setBrandProfile={setBrandProfile}
            isGenerating={isGenerating}
            generatedAssets={generatedAssets}
            onGenerate={handleGenerateAssets}
            onApplyColorPalette={applyColorPalette}
            onApplyFontPairing={applyFontPairing}
          />
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <VoiceToneTab
            brandProfile={brandProfile}
            setBrandProfile={setBrandProfile}
            suggestions={suggestions}
            onGetSuggestions={handleGetSuggestions}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentGuidelinesTab
            brandProfile={brandProfile}
            setBrandProfile={setBrandProfile}
            newKeyMessage={newKeyMessage}
            setNewKeyMessage={setNewKeyMessage}
            newDo={newDo}
            setNewDo={setNewDo}
            newDont={newDont}
            setNewDont={setNewDont}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <BrandPreviewTab brandProfile={brandProfile} insights={insights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}