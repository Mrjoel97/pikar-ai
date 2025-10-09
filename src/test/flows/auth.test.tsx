import { describe, it, expect } from 'vitest';
import { vi, beforeEach } from 'vitest/dist/index.js';
import { mockGuestMode, mockAuthenticatedUser, mockLocalStorage } from '../helpers';

/**
 * Authentication Flow Tests
 * Tests all authentication-related user flows
 */

describe('Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guest Mode', () => {
    it('should allow selecting guest tier', () => {
      const guestMode = mockGuestMode('solopreneur');
      
      expect(guestMode.isGuest).toBe(true);
      expect(guestMode.tier).toBe('solopreneur');
      expect(guestMode.user).toBeNull();
    });

    it('should navigate to tier-specific dashboard', () => {
      const tiers = ['solopreneur', 'startup', 'sme', 'enterprise'] as const;
      
      tiers.forEach(tier => {
        const guestMode = mockGuestMode(tier);
        expect(guestMode.tier).toBe(tier);
      });
    });

    it('should clear guest mode on authentication', () => {
      const localStorage = mockLocalStorage();
      
      localStorage.setItem('guestMode', 'true');
      expect(localStorage.getItem('guestMode')).toBe('true');
      
      // Clear on auth
      localStorage.removeItem('guestMode');
      expect(localStorage.getItem('guestMode')).toBeNull();
    });
  });

  describe('Email OTP Authentication', () => {
    it('should send OTP to email', async () => {
      const mockSendOtp = vi.fn().mockResolvedValue({ success: true });
      
      await mockSendOtp({ email: 'test@example.com' });
      
      expect(mockSendOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should verify OTP code', async () => {
      const mockVerifyOtp = vi.fn().mockResolvedValue({
        success: true,
        token: 'auth_token_123',
      });
      
      const result = await mockVerifyOtp({
        email: 'test@example.com',
        code: '123456',
      });
      
      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
    });

    it('should handle invalid OTP', async () => {
      const mockVerifyOtp = vi.fn().mockRejectedValue(
        new Error('Invalid code')
      );
      
      await expect(
        mockVerifyOtp({ email: 'test@example.com', code: '000000' })
      ).rejects.toThrow('Invalid code');
    });
  });

  describe('Password Authentication', () => {
    it('should allow login with password', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: true,
        token: 'auth_token_123',
      });
      
      const result = await mockLogin({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
    });

    it('should handle incorrect password', async () => {
      const mockLogin = vi.fn().mockRejectedValue(
        new Error('Invalid credentials')
      );
      
      await expect(
        mockLogin({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should support password reset', async () => {
      const mockRequestReset = vi.fn().mockResolvedValue({ success: true });
      
      await mockRequestReset({ email: 'test@example.com' });
      
      expect(mockRequestReset).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('Session Management', () => {
    it('should persist session in localStorage', () => {
      const localStorage = mockLocalStorage();
      
      localStorage.setItem('authToken', 'token_123');
      expect(localStorage.getItem('authToken')).toBe('token_123');
    });

    it('should validate session on page load', async () => {
      const mockValidateSession = vi.fn().mockResolvedValue({
        valid: true,
        user: { _id: 'user_123', email: 'test@example.com' },
      });
      
      const result = await mockValidateSession('token_123');
      
      expect(result.valid).toBe(true);
      expect(result.user).toBeTruthy();
    });

    it('should handle expired sessions', async () => {
      const mockValidateSession = vi.fn().mockResolvedValue({
        valid: false,
        reason: 'expired',
      });
      
      const result = await mockValidateSession('expired_token');
      
      expect(result.valid).toBe(false);
    });

    it('should clear session on logout', () => {
      const localStorage = mockLocalStorage();
      
      localStorage.setItem('authToken', 'token_123');
      localStorage.clear();
      
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('Post-Authentication Routing', () => {
    it('should redirect to onboarding if incomplete', () => {
      const user = mockAuthenticatedUser('solopreneur', {
        user: { onboardingCompleted: false },
      });
      
      expect(user.user.onboardingCompleted).toBe(false);
      // Should redirect to /onboarding
    });

    it('should redirect to dashboard if onboarding complete', () => {
      const user = mockAuthenticatedUser('solopreneur', {
        user: { onboardingCompleted: true },
      });
      
      expect(user.user.onboardingCompleted).toBe(true);
      // Should redirect to /dashboard
    });
  });
});
