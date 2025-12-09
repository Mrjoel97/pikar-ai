import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Paintbrush } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function ThemeCustomizer({ businessId }: { businessId: Id<"businesses"> }) {
  const theme = useQuery(api.whiteLabel.themes.getTheme, { businessId });
  const updateTheme = useMutation(api.whiteLabel.themes.updateTheme);

  const [themeName, setThemeName] = useState("custom");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [borderRadius, setBorderRadius] = useState("0.5rem");

  const handleSave = async () => {
    try {
      await updateTheme({
        businessId,
        themeName,
        typography: {
          fontFamily,
        },
        layout: {
          borderRadius,
          spacing: "1rem",
        },
      });
      toast.success("Theme updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update theme");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          Theme Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="themeName">Theme Name</Label>
          <Input
            id="themeName"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fontFamily">Font Family</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Lato">Lato</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="borderRadius">Border Radius</Label>
          <Select value={borderRadius} onValueChange={setBorderRadius}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="0.25rem">Small</SelectItem>
              <SelectItem value="0.5rem">Medium</SelectItem>
              <SelectItem value="0.75rem">Large</SelectItem>
              <SelectItem value="1rem">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Theme
        </Button>
      </CardContent>
    </Card>
  );
}
