"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Generate OpenAPI 3.0 specification for all public Convex functions
 */
export const generateOpenAPISpec = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    // Base OpenAPI structure
    const spec = {
      openapi: "3.0.0",
      info: {
        title: "Pikar AI API",
        version: "1.0.0",
        description: "Enterprise API for Pikar AI workflow automation and business management platform",
        contact: {
          name: "Pikar AI Support",
          email: "support@pikar.ai"
        }
      },
      servers: [
        {
          url: process.env.VITE_PUBLIC_BASE_URL || "https://api.pikar.ai",
          description: "Production server"
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token obtained from authentication"
          },
          apiKey: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
            description: "API key for programmatic access"
          }
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" }
            }
          },
          Business: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              industry: { type: "string" },
              tier: { type: "string", enum: ["solopreneur", "startup", "sme", "enterprise"] }
            }
          },
          Workflow: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              status: { type: "string" },
              pipeline: { type: "array", items: { type: "object" } }
            }
          },
          Campaign: {
            type: "object",
            properties: {
              _id: { type: "string" },
              subject: { type: "string" },
              status: { type: "string" },
              scheduledAt: { type: "number" }
            }
          }
        }
      },
      security: [
        { bearerAuth: [] },
        { apiKey: [] }
      ],
      paths: {
        "/api/workflows/list": {
          get: {
            summary: "List workflows",
            description: "Retrieve all workflows for the authenticated business",
            tags: ["Workflows"],
            parameters: [
              {
                name: "businessId",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Business ID"
              }
            ],
            responses: {
              "200": {
                description: "List of workflows",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Workflow" }
                    }
                  }
                }
              },
              "401": {
                description: "Unauthorized",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Error" }
                  }
                }
              }
            }
          }
        },
        "/api/workflows/run": {
          post: {
            summary: "Run workflow",
            description: "Execute a workflow with optional parameters",
            tags: ["Workflows"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      workflowId: { type: "string" },
                      startedBy: { type: "string" },
                      params: { type: "object" }
                    },
                    required: ["workflowId", "startedBy"]
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "Workflow run initiated",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        runId: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/api/campaigns/list": {
          get: {
            summary: "List email campaigns",
            description: "Retrieve all email campaigns for the authenticated business",
            tags: ["Campaigns"],
            parameters: [
              {
                name: "businessId",
                in: "query",
                required: true,
                schema: { type: "string" }
              }
            ],
            responses: {
              "200": {
                description: "List of campaigns",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Campaign" }
                    }
                  }
                }
              }
            }
          }
        },
        "/api/webhooks": {
          get: {
            summary: "List webhooks",
            description: "Retrieve all webhooks for the authenticated business",
            tags: ["Webhooks"],
            responses: {
              "200": {
                description: "List of webhooks",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          _id: { type: "string" },
                          url: { type: "string" },
                          events: { type: "array", items: { type: "string" } },
                          active: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: "Create webhook",
            description: "Register a new webhook endpoint",
            tags: ["Webhooks"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      url: { type: "string", format: "uri" },
                      events: { type: "array", items: { type: "string" } },
                      secret: { type: "string" }
                    },
                    required: ["url", "events"]
                  }
                }
              }
            },
            responses: {
              "201": {
                description: "Webhook created",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        webhookId: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      tags: [
        { name: "Workflows", description: "Workflow automation endpoints" },
        { name: "Campaigns", description: "Email campaign management" },
        { name: "Webhooks", description: "Webhook configuration and management" },
        { name: "Analytics", description: "Business analytics and reporting" }
      ]
    };

    return spec;
  }
});
