import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LandingFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      toast("Please enter a valid email address.");
      return;
    }
    try {
      setNewsletterSubmitting(true);
      // Simulate local subscription
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast(`Subscribed with ${email}. Welcome to Pikar AI!`);
      setNewsletterEmail("");
    } catch (err: any) {
      toast(err?.message || "Subscription failed. Please try again later.");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <motion.footer 
      className="pt-12 sm:pt-16 border-t border-border/50"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Newsletter Bar */}
      <motion.div 
        className="px-4 sm:px-6 lg:px-8"
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto neu-raised rounded-2xl bg-card/70 p-5 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold">Stay in the loop</h3>
              <p className="text-sm text-muted-foreground">
                Get product updates, tutorials, and tips. No spam—unsubscribe anytime.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="neu-inset rounded-xl pl-9 focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-label="Email address"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    className="neu-raised rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={newsletterSubmitting}
                  >
                    {newsletterSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Footer Base */}
      <motion.div 
        className="px-4 sm:px-6 lg:px-8"
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="neu-raised rounded-xl p-2">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-semibold">Pikar AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering businesses with intelligent automation.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-foreground transition-colors">Features</button></li>
                <li><button className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button className="hover:text-foreground transition-colors">Docs</button></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-foreground transition-colors">About</button></li>
                <li><button className="hover:text-foreground transition-colors">Blog</button></li>
                <li><button className="hover:text-foreground transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Resources</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-foreground transition-colors">Help Center</button></li>
                <li><button className="hover:text-foreground transition-colors">Guides</button></li>
                <li><button className="hover:text-foreground transition-colors">Status</button></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50 pt-6">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Pikar AI. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                vly.ai
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.footer>
  );
}
