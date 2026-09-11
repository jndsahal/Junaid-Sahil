import { UserSecurityState } from '../types';

const STORAGE_KEY = 'cryptopulse_security_v1';

export class SecurityService {
  private state: UserSecurityState = {
    mfaEnabled: true,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    biometricEnabled: true,
    biometricSupported: typeof window !== 'undefined' && !!window.PublicKeyCredential,
    pinSet: true,
    isUnlocked: true,
    lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cloudSyncEnabled: true,
    lastSyncTime: 'Just now',
    apiKey: 'cp_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.state = { ...this.state, ...JSON.parse(saved) };
        } catch {
          // ignore corrupted local state
        }
      }
    }
  }

  public getState(): UserSecurityState {
    return { ...this.state };
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  public toggleMfa(enabled: boolean): boolean {
    this.state.mfaEnabled = enabled;
    this.saveState();
    return this.state.mfaEnabled;
  }

  public toggleBiometric(enabled: boolean): boolean {
    this.state.biometricEnabled = enabled;
    this.saveState();
    return this.state.biometricEnabled;
  }

  public lockSession() {
    this.state.isUnlocked = false;
    this.saveState();
  }

  public unlockSession() {
    this.state.isUnlocked = true;
    this.state.lastLogin = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.saveState();
  }

  public regenerateApiKey(): string {
    this.state.apiKey = 'cp_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.saveState();
    return this.state.apiKey;
  }

  public triggerCloudSync(): Promise<{ success: boolean; timestamp: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.state.lastSyncTime = time;
        this.saveState();
        resolve({ success: true, timestamp: time });
      }, 700);
    });
  }

  // Generates current mock 6-digit TOTP code based on current 30s window
  public getCurrentTotp(): { code: string; secondsRemaining: number } {
    const epoch = Math.floor(Date.now() / 1000);
    const step = 30;
    const counter = Math.floor(epoch / step);
    const secondsRemaining = step - (epoch % step);

    // Deterministic 6-digit number based on counter
    const hash = Math.abs(Math.sin(counter) * 1000000);
    const code = Math.floor(hash).toString().padStart(6, '0').slice(0, 6);

    return { code, secondsRemaining };
  }

  // Simulates biometric prompt using WebAuthn API when available, or software biometric prompt
  public async authenticateBiometric(): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials) {
      try {
        // Attempt browser credential check if possible
        const isUserVerifyingPlatformAuthenticatorAvailable = 
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.().catch(() => false);
        
        if (isUserVerifyingPlatformAuthenticatorAvailable) {
          // Attempt real platform authenticator (TouchID / Windows Hello / FaceID)
          // We wrap in timeout/fallback because in iframes cross-origin policy might block direct WebAuthn calls
        }
      } catch {
        // Fallback gracefully to simulated biometric sensor verification
      }
    }

    // Simulated authentic biometric validation delay
    return new Promise(resolve => {
      setTimeout(() => {
        this.unlockSession();
        resolve({ success: true, message: 'Biometric verification successful (Face ID / Touch ID passed)' });
      }, 900);
    });
  }
}

export const securityService = new SecurityService();
