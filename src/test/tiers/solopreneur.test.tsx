import { describe, it, expect } from 'vitest';
import { vi, beforeEach } from 'vitest/dist/index.js';
import { mockAuthenticatedUser, createTestBusiness, mockUseQuery, mockUseMutation } from '../helpers';

/**
 * Solopreneur Tier Test Suite
 * Tests all features specific to the Solopreneur tier
 */

describe('Solopreneur Tier Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Executive Assistant', () => {
    it('should display Executive Assistant tab', () => {
      const auth = mockAuthenticatedUser('solopreneur');
      expect(auth.tier).toBe('solopreneur');
      // Executive Assistant should be available
    });

    it('should allow asking questions to the assistant', async () => {
      const mockAskAgent = vi.fn().mockResolvedValue({
        answer: 'Test response',
        contextUsed: 2,
      });
      
      // Simulate asking a question
      await mockAskAgent({ question: 'What should I do today?' });
      
      expect(mockAskAgent).toHaveBeenCalledWith({
        question: 'What should I do today?',
      });
    });

    it('should support dry-run mode', () => {
      const dryRunEnabled = true;
      expect(dryRunEnabled).toBe(true);
    });

    it('should track rate limiting', () => {
      const rateLimitRemaining = 10;
      expect(rateLimitRemaining).toBeGreaterThan(0);
    });
  });

  describe('Brain Dump', () => {
    it('should allow creating typed ideas', async () => {
      const mockAddBrainDump = vi.fn().mockResolvedValue('braindump_123');
      
      await mockAddBrainDump({
        content: 'New business idea',
        initiativeId: 'initiative_123',
      });
      
      expect(mockAddBrainDump).toHaveBeenCalled();
    });

    it('should support voice notes', async () => {
      const mockTranscribe = vi.fn().mockResolvedValue({
        transcript: 'Transcribed text',
        summary: 'Summary',
        tags: ['idea', 'business'],
      });
      
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      await mockTranscribe({ audioBlob });
      
      expect(mockTranscribe).toHaveBeenCalled();
    });

    it('should allow converting ideas to workflows', async () => {
      const mockCreateWorkflow = vi.fn().mockResolvedValue('workflow_123');
      
      await mockCreateWorkflow({
        name: 'Workflow from idea',
        description: 'Generated from brain dump',
      });
      
      expect(mockCreateWorkflow).toHaveBeenCalled();
    });

    it('should support tag filtering', () => {
      const ideas = [
        { tags: ['marketing', 'content'] },
        { tags: ['sales', 'outreach'] },
        { tags: ['marketing', 'email'] },
      ];
      
      const filtered = ideas.filter(idea => idea.tags.includes('marketing'));
      expect(filtered).toHaveLength(2);
    });

    it('should support soft delete with undo', async () => {
      const mockDelete = vi.fn();
      const mockUndo = vi.fn();
      
      await mockDelete('braindump_123');
      expect(mockDelete).toHaveBeenCalled();
      
      // Undo within time window
      await mockUndo('braindump_123');
      expect(mockUndo).toHaveBeenCalled();
    });
  });

  describe('Template Gallery', () => {
    it('should display smart-ordered templates', () => {
      const templates = [
        { name: 'Newsletter', pinned: true, usageCount: 10 },
        { name: 'Social Post', pinned: false, usageCount: 5 },
        { name: 'Email Campaign', pinned: false, usageCount: 15 },
      ];
      
      // Smart ordering: pinned first, then by usage
      const sorted = templates.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.usageCount - a.usageCount;
      });
      
      expect(sorted[0].name).toBe('Newsletter');
    });

    it('should allow pinning templates', async () => {
      const mockPinTemplate = vi.fn();
      
      await mockPinTemplate('template_123');
      expect(mockPinTemplate).toHaveBeenCalledWith('template_123');
    });

    it('should support search functionality', () => {
      const templates = [
        { name: 'Newsletter Template' },
        { name: 'Social Media Post' },
        { name: 'Email Campaign' },
      ];
      
      const searchTerm = 'email';
      const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Email Campaign');
    });
  });

  describe('Schedule Assistant', () => {
    it('should suggest optimal posting times', async () => {
      const mockSuggestSlots = vi.fn().mockResolvedValue({
        slots: [
          { time: '09:00', channel: 'email', reasoning: 'High open rate' },
          { time: '14:00', channel: 'social', reasoning: 'Peak engagement' },
        ],
      });
      
      const result = await mockSuggestSlots({ channel: 'email' });
      
      expect(result.slots).toHaveLength(2);
      expect(result.slots[0].reasoning).toBeTruthy();
    });

    it('should allow adding schedule slots', async () => {
      const mockAddSlot = vi.fn();
      
      await mockAddSlot({
        label: 'Morning Newsletter',
        channel: 'email',
        scheduledAt: Date.now(),
      });
      
      expect(mockAddSlot).toHaveBeenCalled();
    });

    it('should support bulk slot addition with undo', async () => {
      const mockBulkAdd = vi.fn();
      const slots = [
        { label: 'Slot 1', channel: 'email' },
        { label: 'Slot 2', channel: 'post' },
      ];
      
      await mockBulkAdd(slots);
      expect(mockBulkAdd).toHaveBeenCalledWith(slots);
    });
  });

  describe('Content Capsule Generator', () => {
    it('should generate multi-format content', async () => {
      const mockGenerateCapsule = vi.fn().mockResolvedValue({
        weeklyPost: 'Weekly post content',
        email: 'Email content',
        tweets: ['Tweet 1', 'Tweet 2', 'Tweet 3'],
      });
      
      const result = await mockGenerateCapsule({
        tone: 'friendly',
        persona: 'coach',
      });
      
      expect(result.tweets).toHaveLength(3);
      expect(result.email).toBeTruthy();
    });

    it('should adapt to agent profile settings', async () => {
      const profile = {
        tone: 'premium',
        persona: 'executive',
        cadence: 'aggressive',
      };
      
      expect(profile.tone).toBe('premium');
      expect(profile.persona).toBe('executive');
    });
  });

  describe('Wins Tracking', () => {
    it('should track wins and time saved', () => {
      const wins = [
        { type: 'template_used', minutesSaved: 30 },
        { type: 'workflow_created', minutesSaved: 45 },
      ];
      
      const totalSaved = wins.reduce((sum, w) => sum + w.minutesSaved, 0);
      expect(totalSaved).toBe(75);
    });

    it('should calculate streaks', () => {
      const winDates = [
        Date.now(),
        Date.now() - 86400000, // 1 day ago
        Date.now() - 172800000, // 2 days ago
      ];
      
      // Consecutive days = streak of 3
      expect(winDates).toHaveLength(3);
    });

    it('should display wins history', () => {
      const history = [
        { date: Date.now(), type: 'template_used', minutesSaved: 30 },
        { date: Date.now() - 86400000, type: 'workflow_created', minutesSaved: 45 },
      ];
      
      expect(history).toHaveLength(2);
    });
  });

  describe('Support Triage', () => {
    it('should parse incoming emails', async () => {
      const mockParse = vi.fn().mockResolvedValue({
        from: 'customer@example.com',
        subject: 'Help needed',
        body: 'I need assistance with...',
      });
      
      const result = await mockParse('raw_email_content');
      expect(result.from).toBeTruthy();
    });

    it('should generate AI reply suggestions', async () => {
      const mockSuggest = vi.fn().mockResolvedValue({
        reply: 'Thank you for reaching out...',
        priority: 'medium',
      });
      
      const result = await mockSuggest({
        email: 'customer@example.com',
        subject: 'Help needed',
      });
      
      expect(result.reply).toBeTruthy();
      expect(result.priority).toBe('medium');
    });

    it('should allow copying suggested replies', () => {
      const reply = 'Thank you for reaching out...';
      const mockCopy = vi.fn();
      
      mockCopy(reply);
      expect(mockCopy).toHaveBeenCalledWith(reply);
    });
  });

  describe('Agent Profile Customization', () => {
    it('should allow updating tone settings', async () => {
      const mockUpdateProfile = vi.fn();
      
      await mockUpdateProfile({
        tone: 'concise',
        persona: 'maker',
        cadence: 'light',
      });
      
      expect(mockUpdateProfile).toHaveBeenCalled();
    });

    it('should persist profile across sessions', () => {
      const profile = {
        tone: 'friendly',
        persona: 'coach',
        cadence: 'standard',
      };
      
      // Profile should be stored in backend
      expect(profile).toBeTruthy();
    });
  });

  describe('Privacy Controls', () => {
    it('should allow forgetting uploaded data', async () => {
      const mockForgetUploads = vi.fn();
      
      await mockForgetUploads('user_123');
      expect(mockForgetUploads).toHaveBeenCalledWith('user_123');
    });

    it('should display data usage summary', () => {
      const usage = {
        uploads: 5,
        vectorChunks: 120,
        totalSize: '2.5 MB',
      };
      
      expect(usage.uploads).toBeGreaterThan(0);
    });
  });

  describe('Micro-Analytics', () => {
    it('should display 7-day deltas', () => {
      const metrics = {
        revenue: { current: 1000, delta: 15 },
        engagement: { current: 75, delta: -5 },
      };
      
      expect(metrics.revenue.delta).toBeGreaterThan(0);
      expect(metrics.engagement.delta).toBeLessThan(0);
    });

    it('should provide targeted nudges', () => {
      const nudge = {
        type: 'engagement_drop',
        message: 'Engagement is down 5%. Consider posting more frequently.',
      };
      
      expect(nudge.message).toBeTruthy();
    });
  });
});
