import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LogoDropdown } from "@/components/LogoDropdown";

type NavItem = { label: string; icon: React.ComponentType<any>; to: string };

type MobileNavProps = {
  items: Array<NavItem>;
  userDisplay?: string;
  planLabel?: string;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  logoUrl?: string;
};

export function MobileNav({
  items,
  userDisplay,
  planLabel,
  onNavigate,
  onLogout,
  logoUrl,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (to: string) => {
    onNavigate(to);
    setOpen(false);
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <LogoDropdown />
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0">
            <div className="flex flex-col h-full">
              {/* Logo Section */}
              {logoUrl && (
                <div className="p-4 border-b border-border flex justify-center">
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    className="h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* User Info */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="text-sm font-medium truncate">
                  {userDisplay || "User"}
                </div>
                {planLabel && (
                  <div className="text-xs text-muted-foreground truncate">{planLabel}</div>
                )}
              </div>

              {/* Nav Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {items.map((item) => (
                  <button
                    key={`${item.label}-${item.to}`}
                    onClick={() => handleNavigate(item.to)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors active:scale-95"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-border">
                <Button
                  onClick={() => {
                    onLogout();
                    setOpen(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
