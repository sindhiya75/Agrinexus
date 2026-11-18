import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Loader2, AlertCircle, Sprout } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, full_name: fullName });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1c15]/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-cream-300 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-earth-400 hover:text-earth-900 hover:bg-cream-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-forest-700 flex items-center justify-center shadow-md shadow-forest-900/10 text-white">
            <Sprout className="w-6 h-6 text-cream-100" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-earth-900 tracking-tight">AgriNexus AI</h3>
            <p className="text-xs text-earth-500">
              {mode === 'login' ? 'Sign in to access your farms and AI tools' : 'Create a precision farmer account'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-cream-100 rounded-2xl border border-cream-200 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-forest-900 shadow-sm border border-cream-200'
                : 'text-earth-500 hover:text-earth-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-forest-900 shadow-sm border border-cream-200'
                : 'text-earth-500 hover:text-earth-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-earth-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-earth-400" />
                <input
                  type="text"
                  required
                  placeholder="Sindhiya Farmer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-xs text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-earth-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-earth-400" />
              <input
                type="email"
                required
                placeholder="farmer@agrinexus.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-xs text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earth-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-earth-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-xs text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-all"
              />
            </div>
            {mode === 'register' && (
              <p className="text-[11px] text-earth-400 mt-1">Minimum 6 characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs rounded-xl shadow-md shadow-forest-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In to AgriNexus' : 'Create Free Account'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AuthModal;
