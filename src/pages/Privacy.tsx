import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, including when you create an account,
                use our services, or communicate with us. This may include your name, email address,
                and any other information you choose to provide.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-muted-foreground">
                We do not share your personal information with third parties except as described in this
                policy. We may share information with service providers who perform services on our behalf,
                or when required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-muted-foreground">
                We take reasonable measures to protect your information from unauthorized access, use,
                or disclosure. However, no internet transmission is ever fully secure or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete your personal information at any time.
                You may also opt out of receiving promotional communications from us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to collect information about your
                browsing activities and to provide personalized content and advertising.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not directed to children under 13. We do not knowingly collect
                personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of any changes
                by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this privacy policy, please contact us at{" "}
                <a href="mailto:privacy@pikar.ai" className="text-primary hover:underline">
                  privacy@pikar.ai
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
