import { useState, useRef } from 'react';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiPost, ApiError } from '../lib/api';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

type Step = 'email' | 'reset';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start a resend cooldown timer
  const startCooldown = () => {
    setResendDisabled(true);
    setCountdown(60);
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
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiPost('/auth/forgot-password.php', { email });
      toast.success('If an account exists with this email, a reset code has been sent.');
      setStep('reset');
      startCooldown();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await apiPost('/auth/forgot-password.php', { email });
      toast.success('A new reset code has been sent.');
      startCooldown();
    } catch {
      toast.error('Failed to resend code');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    const lastIndex = Math.min(pasted.length, 6) - 1;
    if (lastIndex >= 0) codeRefs.current[lastIndex]?.focus();
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const strength = getPasswordStrength(newPassword);
  const strengthColors = ['bg-charcoal-200', 'bg-red-500', 'bg-amber-500', 'bg-honey-500', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = code.join('');
    if (codeStr.length < 6 || !newPassword || !confirmPassword) return;

    const pwError = validatePassword(newPassword);
    if (pwError) {
      setError(pwError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPost('/auth/reset-password.php', {
        email,
        code: codeStr,
        new_password: newPassword,
      });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
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
          {step === 'email' ? (
            <>
              <h1 className="font-sans font-bold text-xl text-charcoal-900">Reset your password</h1>
              <p className="text-sm text-charcoal-400 mt-1 mb-6">
                Enter your email and we'll send you a reset code
              </p>

              {/* Error banner */}
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-semantic-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="w-full h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-sans font-bold text-xl text-charcoal-900">Enter reset code</h1>
              <p className="text-sm text-charcoal-400 mt-1 mb-6">
                We sent a 6-digit code to <span className="font-bold">{email}</span>
              </p>

              {/* Error banner */}
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-semantic-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 6-digit OTP code input */}
                <div>
                  <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5 text-center">
                    Reset Code
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (codeRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className="w-12 h-14 rounded-lg border border-charcoal-200 bg-cream-50 text-center font-mono text-2xl text-charcoal-900 outline-none transition-all focus:outline-none focus:ring-2 focus:ring-honey-500"
                        disabled={submitting}
                      />
                    ))}
                  </div>
                  <CharacterLimitHint current={code.filter(Boolean).length} max={6} align="center" className="mt-2" />
                </div>

                {/* New Password */}
                <div>
                  <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <CharacterLimitHint current={newPassword.length} max={72} />
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all ${
                              i <= strength ? strengthColors[strength] : 'bg-charcoal-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-charcoal-500 mt-1">
                        {strengthLabels[strength]} • 8–72 characters, one number, one uppercase
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                      placeholder="••••••••"
                      maxLength={72}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <CharacterLimitHint current={confirmPassword.length} max={72} />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !code.every(d => d) || !newPassword || !confirmPassword}
                  className="w-full h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                {/* Resend */}
                <div className="text-sm text-charcoal-400 text-center mt-2">
                  Didn't receive the code?{' '}
                  {resendDisabled ? (
                    <span className="text-charcoal-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-honey-600 font-bold hover:text-honey-700"
                    >
                      Resend
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* Back to login */}
          <p className="text-sm text-charcoal-400 text-center mt-5">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-honey-600 font-bold hover:text-honey-700"
            >
              Log in
            </button>
          </p>
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
