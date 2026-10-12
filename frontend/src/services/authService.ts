/**
 * EthioTelecom Authentication Service
 * Supports Mobile Station International Subscriber Directory Number (MSISDN) login,
 * SMS OTP verification, and TeleBirr Direct Connect.
 */

import { UserProfile } from '../types';
import { StorageService } from './storageService';
import { apiService } from './apiService';

export interface AuthResponse {
  success: boolean;
  message: string;
  profile?: UserProfile;
}

export const AuthService = {
  /**
   * Request 6-digit OTP code via EthioTelecom SMS gateway
   */
  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string; demoOtp: string }> {
    const res = await apiService.requestOtp(phoneNumber);
    return {
      success: res.success,
      message: res.message,
      demoOtp: res.demoOtp || '',
    };
  },

  /**
   * Verify 6-digit OTP and log in with live PostgreSQL persistence
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthResponse> {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      return {
        success: false,
        message: 'Invalid 6-digit verification code. Please enter the 6 digits received via SMS.',
      };
    }

    try {
      const res = await apiService.verifyOtp(phoneNumber, trimmedOtp);
      if (res.success && res.profile) {
        StorageService.saveProfile(res.profile);
        return {
          success: true,
          message: res.message || 'Successfully authenticated with EthioTelecom.',
          profile: res.profile,
        };
      }
      return {
        success: false,
        message: res.message || 'Authentication failed. Please verify your phone number.',
      };
    } catch (e: any) {
      console.warn('[AuthService] Live login error:', e);
      return {
        success: false,
        message: e?.message || 'Authentication failed. Please verify your phone number.',
      };
    }
  },

  /**
   * Live TeleBirr Authenticator
   */
  async loginWithTeleBirr(phoneNumber?: string, token?: string): Promise<AuthResponse> {
    try {
      const serverProfile = await apiService.loginWithTelebirr(phoneNumber, token);
      if (serverProfile) {
        StorageService.saveProfile(serverProfile);
        return {
          success: true,
          message: 'Connected with TeleBirr SuperApp successfully.',
          profile: serverProfile,
        };
      }
    } catch (e) {
      console.warn('[AuthService] TeleBirr login failed:', e);
    }

    return {
      success: false,
      message: 'Failed to authenticate via Telebirr gateway.',
    };
  },

  /**
   * Sign out and clear authenticated session
   */
  signOut(): UserProfile {
    apiService.clearToken();
    return StorageService.clearSession();
  }
};
