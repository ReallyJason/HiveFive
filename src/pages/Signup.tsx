import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { UniversitySearch } from '../components/UniversitySearch';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { apiGet, ApiError } from '../lib/api';
import { universityFromEmail } from '../lib/universities';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    university: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const usernameDerivedFromEmail = useRef(true);

  // Auto-fill university from email domain
  useEffect(() => {
    if (!formData.email) return;
    const match = universityFromEmail(formData.email);
    if (match) {
      setFormData((prev) => ({ ...prev, university: match }));
    }
  }, [formData.email]);

  // Auto-derive username from email prefix when user hasn't manually edited it
  useEffect(() => {
    if (!formData.email || !usernameDerivedFromEmail.current) return;
    const prefix = formData.email.split('@')[0] ?? '';
    const clean = prefix.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50);
    if (clean) {
      setFormData((prev) => ({ ...prev, username: clean }));
    }
  }, [formData.email]);

  const checkUsernameAvailability = useCallback((username: string) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    if (!username || username.length < 2) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiGet<{ available: boolean; reason?: string }>('/auth/check-username.php', { username });
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (formData.username) checkUsernameAvailability(formData.username);
    else setUsernameStatus('idle');
  }, [formData.username, checkUsernameAvailability]);

  const validateFullName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    if (trimmed.split(/\s+/).length < 2) {
      return 'Please enter your first and last name';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (!email.endsWith('.edu')) {
      return 'HiveFive is exclusively for students with .edu email addresses.';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
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

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    let error = '';

    if (field === 'fullName') {
      error = validateFullName(formData.fullName);
    } else if (field === 'email') {
      error = validateEmail(formData.email);
    } else if (field === 'password') {
      error = validatePassword(formData.password);
    } else if (field === 'confirmPassword' && formData.confirmPassword !== formData.password) {
      error = "Passwords don't match";
    }

    setErrors({ ...errors, [field]: error });
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim().split(/\s+/).length >= 2 &&
      validateEmail(formData.email) === '' &&
      formData.username.length >= 2 &&
      usernameStatus === 'available' &&
      validatePassword(formData.password) === '' &&
      formData.password === formData.confirmPassword &&
      formData.university &&
      agreedToTerms
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    setApiError(null);

    // Split fullName into first / last for the API
    const nameParts = formData.fullName.trim().split(/\s+/);
    const first_name = nameParts[0] ?? '';
    const last_name = nameParts.slice(1).join(' ') || '';

    try {
      await signup({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        first_name,
        last_name,
        university: formData.university,
      });
      toast.success('Account created! Check your email for a verification code.');
      navigate('/verify');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.';
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-charcoal-200', 'bg-red-500', 'bg-amber-500', 'bg-honey-500', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const inferredUniversity = universityFromEmail(formData.email);
  const isUniversityLocked = !!inferredUniversity;

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
          <h1 className="font-sans font-bold text-xl text-charcoal-900">Create your account</h1>
          <p className="text-sm text-charcoal-400 mt-1 mb-6">Join your campus community</p>

          {/* API error banner */}
          {apiError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-semantic-error">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={`block font-sans font-medium text-sm mb-1.5 ${errors.fullName && touched.fullName ? 'text-red-500' : 'text-charcoal-700'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onBlur={() => handleBlur('fullName')}
                className={`w-full h-11 px-3.5 rounded-md border-[1.5px] bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all ${
                  errors.fullName && touched.fullName
                    ? 'border-red-500 bg-red-50'
                    : 'border-charcoal-200 focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100'
                }`}
                placeholder="Jordan Park"
                maxLength={100}
                disabled={submitting}
              />
              {errors.fullName && touched.fullName && (
                <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
              )}
              <CharacterLimitHint current={formData.fullName.length} max={100} />
            </div>

            {/* Email */}
            <div>
              <label className={`block font-sans font-medium text-sm mb-1.5 ${errors.email && touched.email ? 'text-semantic-error' : 'text-charcoal-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                className={`w-full h-11 px-3.5 rounded-md border-[1.5px] bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all ${
                  errors.email && touched.email
                    ? 'border-semantic-error bg-red-50 ring-[3px] ring-red-100'
                    : 'border-charcoal-200 focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100'
                }`}
                placeholder="you@university.edu"
                maxLength={100}
                disabled={submitting}
              />
              {errors.email && touched.email && (
                <p className="text-xs text-semantic-error mt-1">{errors.email}</p>
              )}
              <CharacterLimitHint current={formData.email.length} max={100} />
            </div>

            {/* Username */}
            <div>
              <label className={`block font-sans font-medium text-sm mb-1.5 ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-500' : 'text-charcoal-700'}`}>
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    usernameDerivedFromEmail.current = false;
                    setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50) });
                  }}
                  onBlur={() => handleBlur('username')}
                  className={`w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all ${
                    usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-red-500 bg-red-50'
                      : usernameStatus === 'available'
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-charcoal-200 focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100'
                  }`}
                  placeholder="your_username"
                  maxLength={50}
                  disabled={submitting}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-charcoal-400 animate-spin" />}
                  {usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
              {usernameStatus === 'taken' && (
                <p className="text-xs text-red-500 mt-1">This username is taken — try another</p>
              )}
              {usernameStatus === 'invalid' && (
                <p className="text-xs text-red-500 mt-1">Only letters, numbers, underscores, hyphens, and dots</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-xs text-emerald-600 mt-1">Available</p>
              )}
              {usernameStatus === 'idle' && formData.username && (
                <p className="text-xs text-charcoal-400 mt-1">This is how others will find you</p>
              )}
              <CharacterLimitHint current={formData.username.length} max={50} />
            </div>

            {/* Password */}
            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={() => handleBlur('password')}
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
              {formData.password && (
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
              <CharacterLimitHint current={formData.password.length} max={72} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-semantic-error bg-red-50 ring-[3px] ring-red-100'
                      : 'border-charcoal-200 focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100'
                  }`}
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
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-xs text-semantic-error mt-1">{errors.confirmPassword}</p>
              )}
              <CharacterLimitHint current={formData.confirmPassword.length} max={72} />
            </div>

            {/* University */}
            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                University
              </label>
              <UniversitySearch
                value={formData.university}
                onChange={(value) => setFormData({ ...formData, university: value })}
                placeholder="Search for your university..."
                disabled={submitting || isUniversityLocked}
              />
              {isUniversityLocked && (
                <p className="text-xs text-charcoal-500 mt-1">
                  Locked to {inferredUniversity} based on your email domain.
                </p>
              )}
            </div>

            {/* TOS Agreement */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-3.5 h-3.5 mt-0.5 rounded border-charcoal-300 text-honey-500 focus:ring-honey-300 cursor-pointer shrink-0"
                style={{ accentColor: '#E9A020' }}
                disabled={submitting}
              />
              <span className="text-xs text-charcoal-500 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-honey-600 hover:text-honey-700 font-medium" target="_blank">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-honey-600 hover:text-honey-700 font-medium" target="_blank">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="w-full h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Footer */}
            <p className="text-sm text-charcoal-400 text-center mt-5">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-honey-600 font-bold hover:text-honey-700"
              >
                Log in
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
