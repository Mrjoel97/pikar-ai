"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const generateSdk = action({
  args: { 
    apiId: v.id("customApis"),
    language: v.union(v.literal("javascript"), v.literal("python"), v.literal("curl")),
  },
  returns: v.object({
    language: v.string(),
    code: v.string(),
  }),
  handler: async (ctx, args): Promise<{ language: string; code: string }> => {
    const apiData = await ctx.runQuery(api.customApis.getApiById, { apiId: args.apiId });
    if (!apiData) throw new Error("API not found");

    const baseUrl = process.env.CONVEX_SITE_URL || "https://your-app.convex.site";
    
    if (args.language === "javascript") {
      return {
        language: "javascript",
        code: `// ${apiData.name} SDK
const API_BASE_URL = "${baseUrl}";
const API_KEY = "your-api-key";

async function ${apiData.name.replace(/\s+/g, '')}(${apiData.requiresAuth ? 'apiKey, ' : ''}data) {
  const response = await fetch(\`\${API_BASE_URL}${apiData.path}\`, {
    method: "${apiData.method}",
    headers: {
      "Content-Type": "application/json",
      ${apiData.requiresAuth ? '"Authorization": `Bearer ${apiKey}`,' : ''}
    },
    ${apiData.method !== "GET" ? 'body: JSON.stringify(data),' : ''}
  });
  
  if (!response.ok) {
    throw new Error(\`API Error: \${response.statusText}\`);
  }
  
  return await response.json();
}

// Usage example:
// const result = await ${apiData.name.replace(/\s+/g, '')}(${apiData.requiresAuth ? 'API_KEY, ' : ''}{ /* your data */ });
`,
      };
    } else if (args.language === "python") {
      return {
        language: "python",
        code: `# ${apiData.name} SDK
import requests
import json

API_BASE_URL = "${baseUrl}"
API_KEY = "your-api-key"

def ${apiData.name.toLowerCase().replace(/\s+/g, '_')}(${apiData.requiresAuth ? 'api_key, ' : ''}data=None):
    headers = {
        "Content-Type": "application/json",
        ${apiData.requiresAuth ? '"Authorization": f"Bearer {api_key}",' : ''}
    }
    
    response = requests.${apiData.method.toLowerCase()}(
        f"{API_BASE_URL}${apiData.path}",
        headers=headers,
        ${apiData.method !== "GET" ? 'json=data' : ''}
    )
    
    response.raise_for_status()
    return response.json()

# Usage example:
# result = ${apiData.name.toLowerCase().replace(/\s+/g, '_')}(${apiData.requiresAuth ? 'API_KEY, ' : ''}{"key": "value"})
`,
      };
    } else {
      return {
        language: "curl",
        code: `# ${apiData.name} API Call
curl -X ${apiData.method} \\
  "${baseUrl}${apiData.path}" \\
  -H "Content-Type: application/json" \\
  ${apiData.requiresAuth ? '-H "Authorization: Bearer YOUR_API_KEY" \\' : ''}
  ${apiData.method !== "GET" ? '-d \'{"key": "value"}\'' : ''}
`,
      };
    }
  },
});