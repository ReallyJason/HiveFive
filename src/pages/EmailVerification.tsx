import { NavBar } from '../components/NavBar';
import { Mail, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { apiPost, ApiError } from '../lib/api';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

export default function EmailVerification() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendDisabled) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setResendDisabled(false);
            clearInterval(timer);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendDisabled]);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if already verified
  if (!authLoading && user?.verified) {
    return <Navigate to={user.onboarding_done ? '/discover' : '/onboarding'} replace />;
  }

  async function verifyCode(submittedCode: string) {
    setVerifying(true);
    setError(null);
    try {
      const res = await apiPost<{ welcome_bonus?: number }>('/auth/verify.php', { code: submittedCode });
      await refreshUser();
      if (res.welcome_bonus) {
        toast.success(`Email verified! You earned ${res.welcome_bonus} HiveCoins as a welcome bonus`);
      } else {
        toast.success('Email verified!');
      }
      setTimeout(() => {
        navigate(user?.onboarding_done ? '/discover' : '/onboarding');
      }, 500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
      setVerifying(false);
    }
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // When all digits are filled, submit
    if (newCode.every((digit) => digit)) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    // Focus last filled input or submit if complete
    const lastIndex = Math.min(pasted.length, 6) - 1;
    if (lastIndex >= 0) inputRefs.current[lastIndex]?.focus();
    if (newCode.every((d) => d)) {
      verifyCode(newCode.join(''));
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setCountdown(60);
    try {
      await apiPost('/auth/resend-verification.php');
      toast.success('New code sent! Check your email.');
    } catch {
      toast.error('Failed to resend code');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-honey-500" />
      </div>
    );
  }

  const userEmail = user?.email || 'your email';

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-out" />

      <div className="max-w-sm mx-auto mt-16 px-4">
        <div className="bg-cream-50 border border-charcoal-100 rounded-xl shadow-sm p-8 text-center">
          <Mail className="w-12 h-12 text-honey-500 mx-auto mb-4" />
          <h1 className="font-sans font-bold text-xl text-charcoal-900">Check your inbox</h1>
          <p className="text-sm text-charcoal-500 mt-2">
            We sent a 6-digit code to <span className="font-bold">{userEmail}</span>
          </p>

          {verifying ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-honey-500" />
              <span className="ml-2 text-sm text-charcoal-500">Verifying...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mt-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 rounded-lg border border-charcoal-200 bg-cream-50 text-center font-mono text-2xl text-charcoal-900 outline-none transition-all focus:outline-none focus:ring-2 focus:ring-honey-500"
                  />
                ))}
              </div>
              <CharacterLimitHint current={code.filter(Boolean).length} max={6} align="center" className="mt-2" />
            </>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="text-sm text-charcoal-400 mt-6">
            Didn't receive it?{' '}
            {resendDisabled ? (
              <span className="text-charcoal-400">Resend in {countdown}s</span>
            ) : (
              <button onClick={handleResend} className="text-honey-600 font-bold hover:text-honey-700">
                Resend code
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/signup')}
            className="text-xs text-charcoal-400 mt-3 hover:text-charcoal-600"
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}
