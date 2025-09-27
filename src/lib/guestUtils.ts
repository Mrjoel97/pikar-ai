import { demoData } from "./demoData";
import { TierType } from "./tierConfig";

export function isGuestMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("guest") === "1";
}

export function getSelectedTier(): TierType {
  const params = new URLSearchParams(window.location.search);
  const tier = params.get("tier") as TierType;
  
  if (tier && ["solopreneur", "startup", "sme", "enterprise"].includes(tier)) {
    return tier;
  }
  
  return "solopreneur"; // fallback
}

export function getDemoData(tier: TierType) {
  return demoData[tier] || demoData.solopreneur;
}

export function navigateToGuestDashboard(tier: TierType) {
  window.location.href = `/dashboard?guest=1&tier=${tier}`;
}

export function showUpgradeCTA(message: string) {
  // This will be used to show upgrade messages
  return {
    message,
    action: () => {
      // In a real app, this would redirect to pricing/signup
      alert("Sign in to access this feature");
    }
  };
}

export function setGuestMode(tier: "solopreneur" | "startup" | "sme" | "enterprise") {
  try {
    localStorage.setItem("guest", "1");
    localStorage.setItem("tierOverride", tier);
  } catch {}
}

export function clearGuestMode() {
  try {
    localStorage.removeItem("guest");
    localStorage.removeItem("tierOverride");
  } catch {}
}

export function isGuestModeActive(): boolean {
  try {
    return localStorage.getItem("guest") === "1";
  } catch {
    return false;
  }
}