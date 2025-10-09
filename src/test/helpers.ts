import { vi } from 'vitest/dist/index.js';

/**
 * Test Utilities and Helpers for Pikar AI Testing
 * Provides mock factories, authentication helpers, and assertion utilities
 */

// Type definitions for test mocks (avoiding dependency on generated types)
type MockId<T extends string> = string & { __tableName: T };

// Mock Convex Client Factory
export const createMockConvexClient = () => ({
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn(),
});

// Mock Authentication Helpers
export const mockGuestMode = (tier: 'solopreneur' | 'startup' | 'sme' | 'enterprise') => ({
  isAuthenticated: false,
  isGuest: true,
  tier,
  user: null,
  business: null,
});

export const mockAuthenticatedUser = (
  tier: 'solopreneur' | 'startup' | 'sme' | 'enterprise',
  overrides?: Partial<any>
) => ({
  isAuthenticated: true,
  isGuest: false,
  tier,
  user: {
    _id: 'user_123' as MockId<'users'>,
    email: 'test@example.com',
    name: 'Test User',
    businessTier: tier,
    onboardingCompleted: true,
    ...overrides?.user,
  },
  business: {
    _id: 'business_123' as MockId<'businesses'>,
    name: 'Test Business',
    industry: 'Technology',
    tier,
    ownerId: 'user_123' as MockId<'users'>,
    teamMembers: ['user_123' as MockId<'users'>],
    ...overrides?.business,
  },
});

// Test Data Factories
export const createTestUser = (overrides?: Partial<any>) => ({
  _id: `user_${Date.now()}` as MockId<'users'>,
  email: `test${Date.now()}@example.com`,
  name: 'Test User',
  businessTier: 'solopreneur',
  onboardingCompleted: true,
  ...overrides,
});

export const createTestBusiness = (overrides?: Partial<any>) => ({
  _id: `business_${Date.now()}` as MockId<'businesses'>,
  name: 'Test Business',
  industry: 'Technology',
  tier: 'solopreneur',
  ownerId: 'user_123' as MockId<'users'>,
  teamMembers: ['user_123' as MockId<'users'>],
  settings: {
    aiAgentsEnabled: [],
    complianceLevel: 'basic',
    dataIntegrations: [],
  },
  ...overrides,
});

export const createTestWorkflow = (overrides?: Partial<any>) => ({
  _id: `workflow_${Date.now()}` as MockId<'workflows'>,
  name: 'Test Workflow',
  description: 'Test workflow description',
  businessId: 'business_123' as MockId<'businesses'>,
  trigger: { type: 'manual' as const },
  approval: { required: false, threshold: 0 },
  pipeline: [],
  template: false,
  tags: [],
  status: 'active' as const,
  ...overrides,
});

export const createTestAgent = (overrides?: Partial<any>) => ({
  _id: `agent_${Date.now()}` as MockId<'aiAgents'>,
  name: 'Test Agent',
  type: 'content_creation',
  businessId: 'business_123' as MockId<'businesses'>,
  description: 'Test agent description',
  isActive: true,
  ...overrides,
});

export const createTestCampaign = (overrides?: Partial<any>) => ({
  _id: `campaign_${Date.now()}` as MockId<'emailCampaigns'>,
  businessId: 'business_123' as MockId<'businesses'>,
  createdBy: 'user_123' as MockId<'users'>,
  subject: 'Test Campaign',
  from: 'test@example.com',
  blocks: [],
  timezone: 'UTC',
  scheduledAt: Date.now(),
  status: 'draft' as const,
  ...overrides,
});

// Mock Convex Hooks
export const mockUseQuery = (returnValue: any) => {
  return vi.fn(() => returnValue);
};

export const mockUseMutation = (implementation?: (...args: any[]) => any) => {
  return vi.fn(() => implementation || vi.fn());
};

export const mockUseAction = (implementation?: (...args: any[]) => any) => {
  return vi.fn(() => implementation || vi.fn());
};

// Tier-Specific Feature Assertions
export const assertTierFeature = (
  tier: string,
  feature: string,
  shouldHaveAccess: boolean
) => {
  const tierFeatures = {
    solopreneur: [
      'executive_assistant',
      'brain_dump',
      'template_gallery',
      'schedule_assistant',
      'content_capsule',
      'wins_tracking',
    ],
    startup: [
      'team_collaboration',
      'crm_integration',
      'ab_testing',
      'social_media_manager',
      'approval_workflows',
      'team_onboarding',
    ],
    sme: [
      'department_dashboards',
      'cross_department_orchestration',
      'governance_automation',
      'compliance_reports',
      'risk_heatmap',
      'capa_console',
    ],
    enterprise: [
      'global_command_center',
      'strategic_command_center',
      'white_label_branding',
      'sso_configuration',
      'scim_provisioning',
      'kms_integration',
    ],
  };

  const hasFeature = tierFeatures[tier as keyof typeof tierFeatures]?.includes(feature);
  
  if (shouldHaveAccess && !hasFeature) {
    throw new Error(`Tier ${tier} should have access to ${feature}`);
  }
  
  if (!shouldHaveAccess && hasFeature) {
    throw new Error(`Tier ${tier} should NOT have access to ${feature}`);
  }
};

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock toast notifications
export const mockToast = () => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
});

// Entitlement check helpers
export const checkEntitlement = (
  tier: string,
  resource: 'workflows' | 'agents' | 'contacts' | 'emails',
  count: number
) => {
  const limits = {
    solopreneur: { workflows: 10, agents: 3, contacts: 500, emails: 1000 },
    startup: { workflows: 50, agents: 10, contacts: 5000, emails: 10000 },
    sme: { workflows: 200, agents: 30, contacts: 50000, emails: 100000 },
    enterprise: { workflows: Infinity, agents: Infinity, contacts: Infinity, emails: Infinity },
  };

  const limit = limits[tier as keyof typeof limits]?.[resource] || 0;
  return count < limit;
};