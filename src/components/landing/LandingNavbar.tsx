import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Brain, Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LandingNavbarProps {
  handleGetStarted: () => void;
  scrollTo: (id: string) => void;
}

export default function LandingNavbar({ handleGetStarted, scrollTo }: LandingNavbarProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="neu-raised rounded-xl p-1.5 sm:p-2 bg-primary/10">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <span className="text-base sm:text-xl font-bold tracking-tight">Pikar AI</span>
          </motion.div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate("/")}
              aria-label="Go to Home"
            >
              Home
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => scrollTo("features")}
              aria-label="View Features"
            >
              Features
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => scrollTo("pricing")}
              aria-label="View Pricing"
            >
              Pricing
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate("/docs")}
              aria-label="View Docs"
            >
              Docs
            </button>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="neu-flat rounded-xl bg-card/70 hover:bg-card text-foreground"
                onClick={() => navigate("/auth")}
                aria-label="Sign in"
              >
                Sign In
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="neu-raised rounded-xl bg-primary hover:bg-primary/90"
                onClick={() => navigate("/auth")}
                aria-label="Get started"
              >
                Get Started
              </Button>
            </motion.div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="neu-flat rounded-xl"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] sm:w-96 max-w-sm">
                <div className="mt-6 space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="neu-raised rounded-xl p-2 bg-primary/10">
                      <Brain className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-lg font-semibold">Pikar AI</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/");
                      }}
                      aria-label="Go to Home"
                    >
                      Home
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setMobileOpen(false);
                        setTimeout(() => scrollTo("features"), 50);
                      }}
                      aria-label="View Features"
                    >
                      Features
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setMobileOpen(false);
                        setTimeout(() => scrollTo("pricing"), 50);
                      }}
                      aria-label="View Pricing"
                    >
                      Pricing
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/docs");
                      }}
                      aria-label="View Docs"
                    >
                      Docs
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-3">
                    <Button
                      className="w-full neu-flat rounded-xl bg-card/70 hover:bg-card text-foreground"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/auth");
                      }}
                      disabled={isLoading}
                      aria-label="Sign in"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    <Button
                      className="w-full neu-raised rounded-xl bg-[#1B5235] hover:bg-[#17452D] text-white"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/auth");
                      }}
                      aria-label="Get started"
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
