import React, { useState } from 'react';
import { useCustomization } from '../context/CustomizationContext';
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  X,
  AlertCircle,
  CheckCircle2,
  Sliders,
  LogOut,
  Sparkles
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const {
    isAdmin,
    setIsAdmin,
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    verifyAdminPasscode,
    setIsCustomizerOpen,
    setIsWatermarkModalOpen
  } = useCustomization();

  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAdminLoginModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setErrorMsg('Please enter the architect admin passcode');
      return;
    }

    const isValid = verifyAdminPasscode(passcode);
    if (isValid) {
      setErrorMsg('');
      setSuccessMsg('Access granted! Full control unlocked.');
      setTimeout(() => {
        setIsAdminLoginModalOpen(false);
        setSuccessMsg('');
        setPasscode('');
      }, 1000);
    } else {
      setErrorMsg('Invalid passcode. (Hint: default passcode is "zaboraa2026")');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('zaboraa_admin_session');
    } catch {}
    setIsAdminLoginModalOpen(false);
    setPasscode('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isAdmin ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'}`}>
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdmin ? 'Admin Control Center' : 'Architect Access Portal'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAdmin ? 'Admin Mode: Wasim Sayyed (Full Control)' : 'Client Protection: Read-Only by Default'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminLoginModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAdmin ? (
          /* Already Logged In / Admin State */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Admin Mode is Active:</strong> You have full control to edit platform sections, configure watermarks, customize architecture runbooks, and manage founder portraits. Public clients cannot edit anything.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAdminLoginModalOpen(false);
                  setIsCustomizerOpen(true);
                }}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Site Customizer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdminLoginModalOpen(false);
                  setIsWatermarkModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watermark Settings</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Exit to Public Client View</span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock & Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form for Admin */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              Only the lead principal architect has editing permissions. Public visitors and clients view the site in high-fidelity presentation mode.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enter Admin Passcode</span>
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Passcode (default: zaboraa2026)"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-slate-500">
                Default: <span className="text-cyan-400">zaboraa2026</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-md"
                >
                  Unlock Admin
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
