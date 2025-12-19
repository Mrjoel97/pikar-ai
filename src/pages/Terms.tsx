import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
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
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">Terms of Service</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Pikar AI's services, you accept and agree to be bound by the
                terms and provision of this agreement. If you do not agree to these terms, please do
                not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
              <p className="text-muted-foreground">
                Permission is granted to temporarily access and use Pikar AI for personal or commercial
                purposes. This is the grant of a license, not a transfer of title, and under this license
                you may not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose without authorization</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or proprietary notations</li>
                <li>Transfer the materials to another person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account and password.
                You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Service Availability</h2>
              <p className="text-muted-foreground">
                We strive to provide uninterrupted service, but we do not guarantee that our services
                will be available at all times. We may suspend or terminate services for maintenance,
                updates, or other reasons.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. User Content</h2>
              <p className="text-muted-foreground">
                You retain all rights to any content you submit, post, or display on or through our
                services. By submitting content, you grant us a worldwide, non-exclusive, royalty-free
                license to use, copy, reproduce, and process your content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Prohibited Activities</h2>
              <p className="text-muted-foreground">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Violating laws or regulations</li>
                <li>Infringing on intellectual property rights</li>
                <li>Transmitting malicious code or viruses</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Interfering with or disrupting our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Disclaimer</h2>
              <p className="text-muted-foreground">
                The materials on Pikar AI are provided on an 'as is' basis. We make no warranties,
                expressed or implied, and hereby disclaim all other warranties including, without
                limitation, implied warranties of merchantability, fitness for a particular purpose,
                or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitations of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall Pikar AI or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business interruption)
                arising out of the use or inability to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to our services immediately,
                without prior notice or liability, for any reason, including breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any
                material changes by posting the new terms on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@pikar.ai" className="text-primary hover:underline">
                  legal@pikar.ai
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
