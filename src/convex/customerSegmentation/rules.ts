import { v } from "convex/values";

/**
 * Segmentation rules engine
 * Defines criteria and logic for customer segmentation
 */

export interface SegmentRule {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  priority: number;
}

export interface SegmentCriteria {
  engagement?: {
    minScore?: number;
    maxScore?: number;
    lastEngagedDays?: number;
  };
  status?: string[];
  tags?: {
    include?: string[];
    exclude?: string[];
    requireAll?: boolean;
  };
  lifecycle?: {
    minDaysSinceCreation?: number;
    maxDaysSinceCreation?: number;
  };
  behavior?: {
    emailOpens?: number;
    emailClicks?: number;
    purchases?: number;
  };
}

/**
 * Pre-defined segmentation rules for solopreneurs
 */
export const SOLOPRENEUR_RULES: SegmentRule[] = [
  {
    id: "new-subscribers",
    name: "New Subscribers",
    description: "Contacts added in the last 7 days",
    criteria: {
      lifecycle: { maxDaysSinceCreation: 7 },
      status: ["subscribed"],
    },
    priority: 1,
  },
  {
    id: "highly-engaged",
    name: "Highly Engaged",
    description: "Contacts with engagement score above 70",
    criteria: {
      engagement: { minScore: 70 },
      status: ["subscribed"],
    },
    priority: 2,
  },
  {
    id: "needs-nurturing",
    name: "Needs Nurturing",
    description: "Low engagement, but still subscribed",
    criteria: {
      engagement: { maxScore: 40 },
      status: ["subscribed"],
    },
    priority: 3,
  },
  {
    id: "re-engagement-target",
    name: "Re-engagement Target",
    description: "No engagement in 30-90 days",
    criteria: {
      engagement: { lastEngagedDays: 30 },
      status: ["subscribed"],
    },
    priority: 4,
  },
  {
    id: "vip-tagged",
    name: "VIP Tagged",
    description: "Contacts tagged as VIP or premium",
    criteria: {
      tags: { include: ["vip", "premium"] },
    },
    priority: 5,
  },
];

/**
 * Evaluate if a contact matches a segment rule
 */
export function evaluateRule(contact: any, rule: SegmentRule): boolean {
  const { criteria } = rule;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Check engagement criteria
  if (criteria.engagement) {
    if (criteria.engagement.minScore !== undefined) {
      if (!contact.engagementScore || contact.engagementScore < criteria.engagement.minScore) {
        return false;
      }
    }
    if (criteria.engagement.maxScore !== undefined) {
      if (contact.engagementScore && contact.engagementScore > criteria.engagement.maxScore) {
        return false;
      }
    }
    if (criteria.engagement.lastEngagedDays !== undefined) {
      const daysSinceEngagement = contact.lastEngagedAt
        ? (now - contact.lastEngagedAt) / oneDay
        : 999;
      if (daysSinceEngagement < criteria.engagement.lastEngagedDays) {
        return false;
      }
    }
  }

  // Check status criteria
  if (criteria.status && criteria.status.length > 0) {
    if (!criteria.status.includes(contact.status)) {
      return false;
    }
  }

  // Check tags criteria
  if (criteria.tags) {
    const contactTags = contact.tags || [];
    
    if (criteria.tags.include && criteria.tags.include.length > 0) {
      const hasRequiredTags = criteria.tags.requireAll
        ? criteria.tags.include.every(tag => contactTags.includes(tag))
        : criteria.tags.include.some(tag => contactTags.includes(tag));
      
      if (!hasRequiredTags) {
        return false;
      }
    }
    
    if (criteria.tags.exclude && criteria.tags.exclude.length > 0) {
      const hasExcludedTag = criteria.tags.exclude.some(tag => contactTags.includes(tag));
      if (hasExcludedTag) {
        return false;
      }
    }
  }

  // Check lifecycle criteria
  if (criteria.lifecycle) {
    const daysSinceCreation = (now - contact._creationTime) / oneDay;
    
    if (criteria.lifecycle.minDaysSinceCreation !== undefined) {
      if (daysSinceCreation < criteria.lifecycle.minDaysSinceCreation) {
        return false;
      }
    }
    
    if (criteria.lifecycle.maxDaysSinceCreation !== undefined) {
      if (daysSinceCreation > criteria.lifecycle.maxDaysSinceCreation) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Apply multiple rules to a list of contacts
 */
export function applyRules(contacts: any[], rules: SegmentRule[]): Map<string, any[]> {
  const segmentMap = new Map<string, any[]>();

  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const matchingContacts = contacts.filter(contact => evaluateRule(contact, rule));
    segmentMap.set(rule.id, matchingContacts);
  }

  return segmentMap;
}

/**
 * Get segment statistics
 */
export function getSegmentStats(contacts: any[], segmentMap: Map<string, any[]>) {
  const totalContacts = contacts.length;
  const stats: any[] = [];

  segmentMap.forEach((segmentContacts, segmentId) => {
    stats.push({
      segmentId,
      count: segmentContacts.length,
      percentage: totalContacts > 0 ? Math.round((segmentContacts.length / totalContacts) * 100) : 0,
    });
  });

  return stats;
}
