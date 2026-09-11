import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Fingerprint, 
  Key, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Smartphone, 
  Cloud, 
  AlertCircle 
} from 'lucide-react';
import { securityService } from '../services/securityService';
import { soundService } from '../services/soundService';
import { UserSecurityState } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  darkMode
}) => {
  const [securityState, setSecurityState] = useState<UserSecurityState>(securityService.getState());
  const [totpData, setTotpData] = useState<{ code: string; secondsRemaining: number }>({ code: '000000', secondsRemaining: 30 });
  const [verifyingBio, setVerifyingBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncTimestamp, setSyncTimestamp] = useState(securityState.lastSyncTime);

  // Update TOTP code tick
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTotpData(securityService.getCurrentTotp());
    }, 1000);
    setTotpData(securityService.getCurrentTotp());
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMfa = () => {
    const newState = securityService.toggleMfa(!securityState.mfaEnabled);
    setSecurityState(prev => ({ ...prev, mfaEnabled: newState }));
    soundService.playAuthSuccess();
  };

  const handleToggleBiometric = () => {
    const newState = securityService.toggleBiometric(!securityState.biometricEnabled);
    setSecurityState(prev => ({ ...prev, biometricEnabled: newState }));
    soundService.playAuthSuccess();
  };

  const handleTestBiometric = async () => {
    setVerifyingBio(true);
    setBioSuccess(false);
    const res = await securityService.authenticateBiometric();
    setVerifyingBio(false);
    if (res.success) {
      setBioSuccess(true);
      soundService.playAuthSuccess();
      setTimeout(() => setBioSuccess(false), 3000);
    }
  };

  const handleManualSync = async () => {
    setSyncingCloud(true);
    const res = await securityService.triggerCloudSync();
    setSyncingCloud(false);
    setSyncTimestamp(res.timestamp);
    soundService.playAuthSuccess();
  };

  const handleCopySecret = () => {
    if (securityState.mfaSecret) {
      navigator.clipboard.writeText(securityState.mfaSecret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Institutional Security & MFA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Biometric Face ID/Touch ID, TOTP Authenticator & Cloud Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Biometric Login Section */}
          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-blue-50/40 border-blue-100'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white mt-0.5">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Biometric Face ID / Touch ID Protection</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Uses native hardware WebAuthn security keys to protect high-value trades, withdrawal actions, and API credentials.
                  </p>
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Cross-Platform Hardware Compatible (iOS, Android, Mac, Windows)
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={securityState.biometricEnabled}
                onChange={handleToggleBiometric}
                className="w-4 h-4 text-blue-600 rounded mt-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handleTestBiometric}
                disabled={verifyingBio}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Fingerprint className={`w-3.5 h-3.5 ${verifyingBio ? 'animate-pulse' : ''}`} />
                <span>{verifyingBio ? 'Scanning Sensor...' : 'Test Biometric Unlock'}</span>
              </button>

              {bioSuccess && (
                <span className="text-xs font-bold text-emerald-500 flex items-center space-x-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Biometric Verified Successfully!</span>
                </span>
              )}
            </div>
          </div>

          {/* Multi-Factor Authentication (TOTP 2FA) */}
          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/60 border-slate-200'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-indigo-600 text-white mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Two-Factor Authenticator (TOTP)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Google Authenticator, Authy, or 1Password compatible 6-digit rolling security tokens.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={securityState.mfaEnabled}
                onChange={handleToggleMfa}
                className="w-4 h-4 text-blue-600 rounded mt-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {securityState.mfaEnabled && (
              <div className="mt-4 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Live 6-Digit Rotating Token
                    </span>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-widest mt-0.5">
                      {totpData.code.slice(0, 3)} {totpData.code.slice(3)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Refreshes In</span>
                    <span className="text-sm font-bold text-amber-500">
                      {totpData.secondsRemaining}s
                    </span>
                  </div>
                </div>

                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000"
                    style={{ width: `${(totpData.secondsRemaining / 30) * 100}%` }}
                  />
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-sans text-slate-500">
                  <div className="truncate max-w-[260px] font-mono text-[11px]">
                    Secret: {securityState.mfaSecret}
                  </div>
                  <button
                    onClick={handleCopySecret}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seamless Cloud Data Synchronization */}
          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/60 border-slate-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white mt-0.5">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Seamless Cloud Data Synchronization</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Instantly syncs custom alerts, portfolio positions, widget preferences, and watchlists across iOS, Android, and Desktop.
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">
                    Last Cloud Sync: {syncTimestamp}
                  </span>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={syncingCloud}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:border-blue-500 transition-all flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin text-blue-500' : ''}`} />
                <span>{syncingCloud ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
