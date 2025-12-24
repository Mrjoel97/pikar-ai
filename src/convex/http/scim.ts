import { httpAction } from "../_generated/server";

export const getUsers = httpAction(async (ctx: any, req) => {
  // Authenticate via Bearer token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // In production, validate token against stored API keys
  const token = authHeader.substring(7);
  
  // Return SCIM user list (simplified)
  return new Response(
    JSON.stringify({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      totalResults: 0,
      Resources: [],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/scim+json" },
    }
  );
});

export const createUser = httpAction(async (ctx: any, req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  
  // Create user via SCIM
  const scimId = `scim_user_${Date.now()}`;
  
  return new Response(
    JSON.stringify({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: scimId,
      userName: body.userName,
      active: body.active ?? true,
      meta: {
        resourceType: "User",
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/scim+json" },
    }
  );
});

export const getGroups = httpAction(async (ctx: any, req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      totalResults: 0,
      Resources: [],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/scim+json" },
    }
  );
});

export const createGroup = httpAction(async (ctx: any, req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const scimId = `scim_group_${Date.now()}`;
  
  return new Response(
    JSON.stringify({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      id: scimId,
      displayName: body.displayName,
      members: body.members || [],
      meta: {
        resourceType: "Group",
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/scim+json" },
    }
  );
});
