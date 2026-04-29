import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { CustomSelect } from '../components/CustomSelect';
import { DatePicker } from '../components/DatePicker';
import { useNavigate, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Sparkles, HelpCircle, DollarSign, Eye, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { apiGet, apiPost, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES, BUDGET_RANGES, parseLocalDate } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

interface CategoryHints {
  pricing: { min: number | null; max: number | null; avg: number | null; count: number };
  proposals: { avg_per_request: number | null; total_requests: number; median_hours_to_first: number | null };
}

type Step = 1 | 2 | 3 | 4;

interface FormData {
  title: string;
  category: string;
  description: string;
  budgetRange: string;
  deadline: string;
}

export function PostRequest() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    description: '',
    budgetRange: '',
    deadline: '',
  });

  const [categoryHints, setCategoryHints] = useState<CategoryHints | null>(null);

  useEffect(() => {
    if (!formData.category) { setCategoryHints(null); return; }
    let stale = false;
    apiGet<CategoryHints>('/api/requests/category-hints.php', { category: formData.category })
      .then((data) => { if (!stale) setCategoryHints(data); })
      .catch(() => { if (!stale) setCategoryHints(null); });
    return () => { stale = true; };
  }, [formData.category]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Auth gate: redirect if not logged in (after loading completes)
  if (!authLoading && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Show spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-honey-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  const handleNext = () => {
    setCurrentStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate(-1);
    } else {
      setCurrentStep((prev) => ((prev - 1) as Step));
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setApiError(null);
    setFieldErrors({});

    try {
      await apiPost('/requests/create.php', {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        budget_range: formData.budgetRange,
        deadline: formData.deadline || undefined,
      });

      navigate('/request-published', { state: { requestData: formData } });
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | undefined;
        if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
          setFieldErrors(data.errors as Record<string, string>);
        }
        setApiError(err.message);
        toast.error(err.message);
      } else {
        setApiError('Something went wrong. Please try again.');
        toast.error('Something went wrong. Please try again.');
      }
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#E9A020', '#F5B540', '#FFD88A', '#FF6B6B', '#4ECDC4'][
                  i % 5
                ],
                left: `${Math.random() * 100}%`,
                top: '-10%',
              }}
              initial={{ y: 0, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-xs text-charcoal-400 tracking-wider">
              STEP {currentStep} OF {totalSteps}
            </div>
            <div className="font-mono text-xs font-medium text-honey-600">
              {currentStep === 1 && "Let's find you help! 🎯"}
              {currentStep === 2 && "You're doing great! 💪"}
              {currentStep === 3 && "Almost there! ⭐"}
              {currentStep === 4 && "Ready to post? ✨"}
            </div>
          </div>
          <div className="h-1.5 bg-charcoal-100 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-honey-400 via-honey-500 to-honey-600 relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                boxShadow: '0 0 8px rgba(232, 185, 49, 0.4)',
              }}
            />
          </div>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-sans font-bold text-sm text-red-900">{apiError}</p>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {Object.entries(fieldErrors).map(([field, message]) => (
                    <li key={field} className="text-sm text-red-700">
                      {field}: {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="popLayout">
          {/* Step 1: What do you need? */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display italic text-4xl md:text-5xl text-charcoal-900 mb-3">
                  What do you need?
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Tell us what you're looking for and we'll connect you with the right people
                </p>
              </div>

              <div className="bg-white border border-charcoal-200 rounded-2xl p-10 space-y-6 shadow-xl">
                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    Request Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Need Spanish tutor for conversational practice"
                    maxLength={150}
                    className="w-full h-14 px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all"
                  />
                  <CharacterLimitHint current={formData.title.length} max={150} />
                  {fieldErrors.title && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.title}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-charcoal-500">
                    Be clear and specific about what you need
                  </p>
                </div>

                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    Category
                  </label>
                  <CustomSelect
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    options={CATEGORIES}
                    placeholder="Choose a category"
                  />
                  {fieldErrors.category && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.category}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Tell us more */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display italic text-4xl md:text-5xl text-charcoal-900 mb-3">
                  Tell us more
                </h1>
                <p className="text-charcoal-600 text-lg">
                  The more details you provide, the better offers you'll receive
                </p>
              </div>

              <div className="bg-white border border-charcoal-200 rounded-2xl p-10 space-y-6 shadow-xl">
                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what you're looking for in detail. Include any specific requirements, skills needed, timeline expectations, or other important information..."
                    rows={8}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all resize-none"
                  />
                  <CharacterLimitHint current={formData.description.length} max={2000} />
                  {fieldErrors.description && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-charcoal-500">
                    Include requirements, timeline, and what success looks like
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Set your budget */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display italic text-4xl md:text-5xl text-charcoal-900 mb-3">
                  Set your budget
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Let providers know your budget range and when you need this done
                </p>
              </div>

              <div className="bg-white border border-charcoal-200 rounded-2xl p-10 space-y-6 shadow-xl">
                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-3">
                    Budget Range
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {BUDGET_RANGES.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setFormData({ ...formData, budgetRange: range.value })}
                        className={`h-14 rounded-xl border-2 font-sans font-medium text-sm transition-all ${
                          formData.budgetRange === range.value
                            ? 'border-honey-500 bg-honey-50 text-charcoal-900 shadow-sm'
                            : 'border-charcoal-200 bg-white text-charcoal-600 hover:border-charcoal-300'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.budget_range && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.budget_range}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-charcoal-500">
                    This is a range — final price will be negotiated with the provider
                  </p>
                  {categoryHints?.pricing.count && categoryHints.pricing.count > 0 && categoryHints.pricing.min != null && categoryHints.pricing.max != null ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-charcoal-500 bg-honey-50 border border-honey-200 rounded-lg p-3">
                      <Sparkles className="size-4 text-honey-600 shrink-0" />
                      <span>Similar services charge ⬡{Math.round(categoryHints.pricing.min)}–{Math.round(categoryHints.pricing.max)}</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    Deadline (Optional)
                  </label>
                  <DatePicker
                    value={formData.deadline}
                    onChange={(date) => setFormData({ ...formData, deadline: date })}
                    placeholder="Select a deadline"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                  <p className="mt-2 text-xs text-charcoal-500">
                    When do you need this completed?
                  </p>
                </div>

                {categoryHints?.proposals.total_requests && categoryHints.proposals.total_requests > 0 && categoryHints.proposals.avg_per_request != null ? (
                  <div className="flex items-center gap-2 text-sm text-charcoal-500 bg-honey-50 border border-honey-200 rounded-lg p-3">
                    <Sparkles className="size-4 text-honey-600 shrink-0" />
                    <span>
                      Average request in this category gets ~{categoryHints.proposals.avg_per_request.toFixed(0)} offer{categoryHints.proposals.avg_per_request >= 1.5 ? 's' : ''}
                      {categoryHints.proposals.median_hours_to_first != null && categoryHints.proposals.median_hours_to_first > 0
                        ? ` within ${categoryHints.proposals.median_hours_to_first <= 24 ? `${categoryHints.proposals.median_hours_to_first} hours` : `${Math.round(categoryHints.proposals.median_hours_to_first / 24)} days`}`
                        : ''}
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview & Post */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display italic text-4xl md:text-5xl text-charcoal-900 mb-3">
                  Ready to post?
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Review your request listing
                </p>
              </div>

              {/* Full Preview */}
              <div className="bg-white border-2 border-honey-400/30 rounded-xl p-8 space-y-6 relative shadow-xl">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-honey-300/20 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ width: '50%' }}
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-display italic text-3xl text-charcoal-900 mb-2">
                      {formData.title || 'Your Request Title'}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block px-3 py-1 bg-honey-100 text-honey-700 text-xs font-medium rounded-full">
                        {formData.category || 'Category'}
                      </span>
                      {formData.budgetRange && (
                        <span className="inline-block px-3 py-1 bg-charcoal-100 text-charcoal-700 text-xs font-medium rounded-full">
                          Budget: {BUDGET_RANGES.find((r) => r.value === formData.budgetRange)?.label}
                        </span>
                      )}
                      {formData.deadline && (
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          Due: {parseLocalDate(formData.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-charcoal-100 pt-6">
                  <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-3">
                    Description:
                  </h3>
                  <p className="text-charcoal-600 leading-relaxed whitespace-pre-wrap">
                    {formData.description || 'Your description will appear here...'}
                  </p>
                </div>

                <div className="border-t border-charcoal-100 pt-6">
                  <div className="bg-honey-50 border border-honey-200 rounded-lg p-4">
                    <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-2">
                      How it works
                    </h3>
                    <ul className="text-sm text-charcoal-700 space-y-1">
                      <li>• Interested providers will send you offers</li>
                      <li>• Review offers and choose the best match</li>
                      <li>• Payment is held securely until work is complete</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Publish Button */}
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full h-16 bg-gradient-to-r from-honey-500 to-honey-600 text-charcoal-900 rounded-xl font-sans font-bold text-lg transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-charcoal-900 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Posting...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    Post Your Request
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            className="h-12 px-6 rounded-lg font-sans font-bold text-sm transition-all flex items-center gap-2 text-charcoal-600 hover:bg-charcoal-50"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          {currentStep < 4 && (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!formData.title || !formData.category)) ||
                (currentStep === 2 && !formData.description) ||
                (currentStep === 3 && !formData.budgetRange)
              }
              className={`h-14 px-8 rounded-xl font-sans font-bold text-base transition-all flex items-center gap-2 ${
                (currentStep === 1 && (!formData.title || !formData.category)) ||
                (currentStep === 2 && !formData.description) ||
                (currentStep === 3 && !formData.budgetRange)
                  ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed'
                  : 'bg-honey-500 text-charcoal-900 hover:bg-honey-600 hover:scale-[1.02] hover:shadow-lg'
              }`}
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
