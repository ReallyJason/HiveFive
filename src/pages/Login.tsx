import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { parseUTC } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await login(email, password, rememberMe);
      const user = res.user;

      // Annual re-verification required
      if (res.needs_reverification) {
        toast.error(res.message || 'Please re-verify your email to continue.');
        navigate('/verify');
        return;
      }

      // First-time verification (new account)
      if (!user.verified) {
        navigate('/verify');
        return;
      }

      toast.success('Welcome back!');
      navigate(user.onboarding_done ? '/discover' : '/onboarding');
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { code?: string; ban_reason?: string; suspended_until?: string };
        setErrorCode(data?.code ?? null);
        setError(err.message);
        setBanReason(data?.ban_reason ?? null);
        setSuspendedUntil(data?.suspended_until ?? null);
      } else {
        setErrorCode(null);
        setError('Could not connect to server. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center py-16">
      <div className="max-w-md w-full px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 rounded-lg bg-honey-500 flex items-center justify-center mb-3">
            <span className="text-charcoal-900 font-bold text-xl">H</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-lg text-charcoal-900 tracking-tight">
              hive<span className="text-[20.5px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-cream-50 border border-charcoal-100 rounded-xl shadow-sm p-8">
          <h1 className="font-sans font-bold text-xl text-charcoal-900">Welcome back</h1>
          <p className="text-sm text-charcoal-400 mt-1 mb-6">Log in to your account</p>

          {/* API error banner */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-semantic-error">
              {errorCode === 'account_not_found' ? (
                <>
                  No account found with this email.{' '}
                  <Link to="/signup" className="font-bold text-honey-600 hover:text-honey-700 underline">
                    Sign up instead
                  </Link>
                </>
              ) : errorCode === 'wrong_password' ? (
                <>
                  Incorrect password.{' '}
                  <Link to="/forgot-password" className="font-bold text-honey-600 hover:text-honey-700 underline">
                    Reset your password
                  </Link>
                </>
              ) : errorCode === 'banned' ? (
                <>
                  Your account has been permanently banned.
                  {banReason && <span className="block mt-1 text-charcoal-500">Reason: {banReason}</span>}
                  <span className="block mt-1 text-charcoal-500">
                    Contact <span className="font-medium">support@hivefive.com</span> if you believe this is an error.
                  </span>
                </>
              ) : errorCode === 'suspended' ? (
                <>
                  Your account is temporarily suspended.
                  {suspendedUntil && (
                    <span className="block mt-1 text-charcoal-500">
                      Access will be restored on {parseUTC(suspendedUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                    </span>
                  )}
                </>
              ) : (
                error
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                placeholder="your.email@example.com"
                maxLength={100}
                disabled={submitting}
              />
              <CharacterLimitHint current={email.length} max={100} />
            </div>

            {/* Password */}
            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                  placeholder="••••••••"
                  maxLength={72}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <CharacterLimitHint current={password.length} max={72} />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-charcoal-300 text-honey-500 focus:ring-honey-300 cursor-pointer"
                    style={{ accentColor: '#E9A020' }}
                    disabled={submitting}
                  />
                  <span className="text-xs text-charcoal-500">Remember me for 30 days</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-honey-600 font-medium hover:text-honey-700"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>

            {/* Footer */}
            <p className="text-sm text-charcoal-400 text-center mt-5">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-honey-600 font-bold hover:text-honey-700"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-charcoal-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
