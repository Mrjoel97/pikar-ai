    let allowed = false;
    try {
      if (args.adminToken) {
        // Use require to completely bypass type inference
        const internalAny = require("./_generated/api").internal;
        const res: any = await ctx.runQuery(internalAny.adminAuthData.validateSession, { token: args.adminToken } as any);
        allowed = !!(res && res.valid);
      }
    } catch {}