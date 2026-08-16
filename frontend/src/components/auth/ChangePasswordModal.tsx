import React, { useState, useCallback } from 'react';
import { X, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChangePasswordModalProps {
  onClose: () => void;
}

interface FieldState {
  value: string;
  show: boolean;
}

const MIN_LENGTH = 8;

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= MIN_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Very Weak', color: '#ef4444' };
  if (score === 2) return { score, label: 'Weak', color: '#f97316' };
  if (score === 3) return { score, label: 'Fair', color: '#eab308' };
  if (score === 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#06b6d4' };
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState<FieldState>({ value: '', show: false });
  const [next, setNext] = useState<FieldState>({ value: '', show: false });
  const [confirm, setConfirm] = useState<FieldState>({ value: '', show: false });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(next.value);
  const passwordsMatch = next.value && confirm.value && next.value === confirm.value;
  const passwordsMismatch = confirm.value && next.value !== confirm.value;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (next.value.length < MIN_LENGTH) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (next.value !== confirm.value) {
        setError('New passwords do not match.');
        return;
      }

      setIsLoading(true);
      const res = await changePassword(current.value, next.value, confirm.value);
      setIsLoading(false);

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Failed to change password.');
      }
    },
    [changePassword, current.value, next.value, confirm.value]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">Change Password</h2>
              <p className="text-xs text-slate-400 mt-0.5">Update your account credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
              >
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Password Updated!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Your password has been changed successfully. Other sessions have been signed out for security.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Error Banner */}
              {error && (
                <div className="flex items-start space-x-2.5 px-3.5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <label htmlFor="current-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={current.show ? 'text' : 'password'}
                    value={current.value}
                    onChange={(e) => setCurrent((s) => ({ ...s, value: e.target.value }))}
                    placeholder="Enter current password"
                    required
                    autoComplete="current-password"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
                    style={{
                      background: 'rgba(30,41,59,0.8)',
                      border: '1px solid rgba(100,116,139,0.4)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCurrent((s) => ({ ...s, show: !s.show }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    tabIndex={-1}
                    aria-label="Toggle current password visibility"
                  >
                    {current.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={next.show ? 'text' : 'password'}
                    value={next.value}
                    onChange={(e) => setNext((s) => ({ ...s, value: e.target.value }))}
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
                    style={{
                      background: 'rgba(30,41,59,0.8)',
                      border: '1px solid rgba(100,116,139,0.4)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setNext((s) => ({ ...s, show: !s.show }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    tabIndex={-1}
                    aria-label="Toggle new password visibility"
                  >
                    {next.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter */}
                {next.value && (
                  <div className="space-y-1">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: i <= strength.score ? strength.color : 'rgba(100,116,139,0.3)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={confirm.show ? 'text' : 'password'}
                    value={confirm.value}
                    onChange={(e) => setConfirm((s) => ({ ...s, value: e.target.value }))}
                    placeholder="Re-enter new password"
                    required
                    autoComplete="new-password"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
                    style={{
                      background: 'rgba(30,41,59,0.8)',
                      border: `1px solid ${
                        passwordsMismatch
                          ? 'rgba(239,68,68,0.5)'
                          : passwordsMatch
                          ? 'rgba(34,197,94,0.5)'
                          : 'rgba(100,116,139,0.4)'
                      }`,
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    {confirm.value && (
                      passwordsMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : passwordsMismatch ? (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      ) : null
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirm((s) => ({ ...s, show: !s.show }))}
                      className="text-slate-400 hover:text-slate-200 transition ml-1"
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {confirm.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-rose-400">Passwords do not match.</p>
                )}
              </div>

              {/* Submit */}
              <button
                id="change-password-submit"
                type="submit"
                disabled={isLoading || !current.value || !next.value || !confirm.value}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
