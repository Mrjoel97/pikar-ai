"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const validateSAMLAssertion = action({
  args: {
    samlResponse: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    email: string;
    firstName: string;
    lastName: string;
    attributes: any;
  }> => {
    const samlify = await import("samlify");

    // Get SAML config
    const config: any = await ctx.runQuery(internal.saml.getSAMLConfigInternal, {
      businessId: args.businessId,
    });

    if (!config || !config.active) {
      throw new Error("SAML not configured or inactive");
    }

    try {
      // Create service provider
      const sp = samlify.ServiceProvider({
        entityID: "pikar-ai",
        assertionConsumerService: [
          {
            Binding: samlify.Constants.namespace.binding.post,
            Location: `${process.env.VITE_PUBLIC_BASE_URL}/auth/saml/acs`,
          },
        ],
      });

      // Create identity provider
      const idp = samlify.IdentityProvider({
        entityID: config.idpEntityId,
        singleSignOnService: [
          {
            Binding: samlify.Constants.namespace.binding.redirect,
            Location: config.ssoUrl,
          },
        ],
        signingCert: config.certificate,
      });

      // Parse and validate SAML response
      const result = await sp.parseLoginResponse(idp, "post", {
        body: { SAMLResponse: args.samlResponse },
      });

      // Extract user info from assertion
      const extract = result.extract;
      const email = extract.nameID || extract.attributes?.email?.[0];
      const firstName = extract.attributes?.firstName?.[0] || "";
      const lastName = extract.attributes?.lastName?.[0] || "";

      if (!email) {
        throw new Error("No email found in SAML assertion");
      }

      return {
        success: true,
        email,
        firstName,
        lastName,
        attributes: extract.attributes,
      };
    } catch (error: any) {
      console.error("SAML validation error:", error);
      throw new Error(`SAML validation failed: ${error.message}`);
    }
  },
});
