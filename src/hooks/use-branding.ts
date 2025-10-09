import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export function useBranding(businessId?: string) {
  const brandingConfig = useQuery(
    api.branding.getBrandingConfig,
    businessId ? { businessId: businessId as any } : "skip"
  );

  useEffect(() => {
    if (brandingConfig) {
      // Apply primary color
      if (brandingConfig.primaryColor) {
        document.documentElement.style.setProperty(
          '--brand-primary',
          brandingConfig.primaryColor
        );
        document.documentElement.style.setProperty(
          '--color-primary',
          brandingConfig.primaryColor
        );
      }

      // Apply secondary color
      if (brandingConfig.secondaryColor) {
        document.documentElement.style.setProperty(
          '--brand-secondary',
          brandingConfig.secondaryColor
        );
        document.documentElement.style.setProperty(
          '--color-secondary',
          brandingConfig.secondaryColor
        );
      }

      // Apply logo URL
      if (brandingConfig.logoUrl) {
        document.documentElement.style.setProperty(
          '--brand-logo-url',
          `url(${brandingConfig.logoUrl})`
        );
      }
    }
  }, [brandingConfig]);

  return brandingConfig;
}
