import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { NavBar } from '../components/NavBar';
import { CustomSelect } from '../components/CustomSelect';
import { CurrencyInput } from '../components/CurrencyInput';
import { Upload, X, Check, Sparkles, Wand2, ListPlus, Undo2, ArrowRight, ArrowLeft, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIES } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { isSupportedImageFile, readFileAsDataUrl, resolveUploadMimeType, SERVICE_IMAGE_ACCEPT, SUPPORTED_IMAGE_COPY } from '../lib/fileUploads';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  title: string;
  category: string;
  description: string;
  included: string[];
  pricingType: 'hourly' | 'flat' | 'custom';
  customUnit: string;
  price: string;
  images: string[];
}

function canPreviewSelectedImage(image?: string): boolean {
  if (!image) return false;
  return !/^data:image\/(heic|heif);/i.test(image);
}

interface ServiceResponse {
  service: {
    id: number;
    title: string;
    category: string;
    description: string;
    price: number;
    pricing_type: string;
    custom_price_unit: string | null;
    included: string[];
    provider_id: number;
    images: string[];
  };
}

export function EditService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    description: '',
    included: [''],
    pricingType: 'hourly',
    customUnit: '',
    price: '',
    images: [],
  });

  const [isRewriting, setIsRewriting] = useState(false);
  const [prePolishDraft, setPrePolishDraft] = useState<string | null>(null);
  const [isSuggestingIncluded, setIsSuggestingIncluded] = useState(false);
  const [justPolished, setJustPolished] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [priceHint, setPriceHint] = useState<{ min: number; max: number; avg: number } | null>(null);
  const canPreviewImage = canPreviewSelectedImage(formData.images[0]);

  useEffect(() => {
    if (!formData.category) { setPriceHint(null); return; }
    let cancelled = false;
    apiGet<{ hint: { min: number; max: number; avg: number } | null }>('/services/price-hint.php', { category: formData.category })
      .then((res) => { if (!cancelled) setPriceHint(res.hint); })
      .catch(() => { if (!cancelled) setPriceHint(null); });
    return () => { cancelled = true; };
  }, [formData.category]);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Fetch service data on mount
  useEffect(() => {
    if (!id || authLoading || !user) return;

    let cancelled = false;

    async function fetchService() {
      try {
        const data = await apiGet<ServiceResponse>('/services/get.php', { id });
        if (cancelled) return;

        const svc = data.service;

        // Verify ownership
        if (svc.provider_id !== user!.id) {
          setFetchError('You do not have permission to edit this service.');
          setFetchLoading(false);
          return;
        }

        setFormData({
          title: svc.title,
          category: svc.category,
          description: svc.description,
          included: svc.included && svc.included.length > 0 ? svc.included : [''],
          pricingType: (svc.pricing_type as 'hourly' | 'flat' | 'custom') || 'hourly',
          customUnit: svc.custom_price_unit || '',
          price: String(svc.price),
          images: Array.isArray(svc.images) ? svc.images : [],
        });
        setFetchLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setFetchError(err.message);
        } else {
          setFetchError('Failed to load service. Please try again.');
        }
        setFetchLoading(false);
      }
    }

    fetchService();
    return () => {
      cancelled = true;
    };
  }, [id, authLoading, user]);

  // Auth gate: redirect if not logged in (after loading completes)
  if (!authLoading && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Show spinner while auth or service data is loading
  if (authLoading || fetchLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="size-8 text-honey-500 animate-spin" />
      </div>
    );
  }

  // Show error if service fetch failed or ownership mismatch
  if (fetchError) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-xl mx-auto px-5 sm:px-6 py-24 text-center">
          <div className="bg-white border border-red-200 rounded-2xl p-10 shadow-xl">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <h1 className="font-display italic text-2xl text-charcoal-900 mb-3">
              Unable to load service
            </h1>
            <p className="text-charcoal-600 mb-6">{fetchError}</p>
            <button
              onClick={() => navigate('/profile')}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!isSupportedImageFile(file)) {
      toast.error(`"${file.name}" is not a supported image type`);
      return;
    }
    if (file.size > maxSize) {
      toast.error(`"${file.name}" exceeds the 5MB size limit`);
      return;
    }

    void readFileAsDataUrl(file, resolveUploadMimeType(file) ?? undefined)
      .then((dataUrl) => {
        setFormData((prev) => ({ ...prev, images: [dataUrl] }));
      })
      .catch(() => {
        toast.error(`"${file.name}" could not be read`);
      });

    e.target.value = '';
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, images: [] }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate(-1);
    } else {
      setCurrentStep((prev) => ((prev - 1) as Step));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setApiError(null);
    setFieldErrors({});

    try {
      await apiPatch<ServiceResponse>(`/services/update.php?id=${id}`, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        included: formData.included.filter((item) => item.trim()),
        pricing_type: formData.pricingType,
        price: formData.price,
        custom_price_unit: formData.pricingType === 'custom' ? formData.customUnit : '',
        images: formData.images,
      });

      toast.success('Service updated successfully');
      navigate(`/service/${id}`);
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
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await apiDelete('/services/delete.php', { id });
      toast.success('Service deleted');
      navigate('/profile');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to delete service. Please try again.');
      }
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const addIncludedItem = () => {
    setFormData({ ...formData, included: [...formData.included, ''] });
  };

  const removeIncludedItem = (index: number) => {
    const newIncluded = formData.included.filter((_, i) => i !== index);
    setFormData({ ...formData, included: newIncluded });
  };

  const updateIncludedItem = (index: number, value: string) => {
    const newIncluded = [...formData.included];
    newIncluded[index] = value;
    setFormData({ ...formData, included: newIncluded });
  };

  const handleAiRewrite = async () => {
    if (isRewriting || !formData.description.trim()) return;
    setIsRewriting(true);
    setPrePolishDraft(formData.description);
    try {
      const res = await apiPost<{ description: string }>('/services/ai-rewrite.php', {
        title: formData.title,
        category: formData.category,
        description: formData.description,
      });
      setFormData((prev) => ({ ...prev, description: res.description }));
      setJustPolished(true);
      setTimeout(() => setJustPolished(false), 2000);
      toast.success('Description polished!');
    } catch (err) {
      setPrePolishDraft(null);
      toast.error(err instanceof ApiError ? err.message : 'AI rewrite failed — try again');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleUndoPolish = () => {
    if (prePolishDraft === null) return;
    setFormData((prev) => ({ ...prev, description: prePolishDraft }));
    setPrePolishDraft(null);
    toast('Restored your original draft');
  };

  const handleSuggestIncluded = async () => {
    if (isSuggestingIncluded) return;
    setIsSuggestingIncluded(true);
    try {
      const res = await apiPost<{ items: string[] }>('/services/ai-suggest-included.php', {
        title: formData.title,
        category: formData.category,
        description: formData.description,
      });
      if (res.items.length > 0) {
        setFormData((prev) => ({
          ...prev,
          included: res.items,
        }));
        toast.success(`Suggested ${res.items.length} items — edit or remove any that don't fit`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not generate suggestions');
    } finally {
      setIsSuggestingIncluded(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-xs text-charcoal-400 tracking-wider">
              STEP {currentStep} OF {totalSteps}
            </div>
            <div className="font-mono text-xs font-medium text-honey-600">
              {currentStep === 1 && 'Update the basics'}
              {currentStep === 2 && 'Refine details'}
              {currentStep === 3 && 'Adjust pricing'}
              {currentStep === 4 && 'Update photos'}
              {currentStep === 5 && 'Review changes'}
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
          {/* Step 1: Update your service details */}
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
                  Edit your service
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Update the title and category for your listing
                </p>
              </div>

              <div className="bg-white border border-charcoal-100 rounded-2xl p-10 space-y-6 shadow-xl">
                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    Service Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Python Tutoring for CS Majors"
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
                    Make it clear and specific — what you do and who it's for
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

          {/* Step 2: Update your description */}
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
                  Refine your description
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Update what people will see about your service
                </p>
              </div>

              <div className="bg-white border border-charcoal-200 rounded-2xl p-10 space-y-6 shadow-xl">
                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (prePolishDraft !== null) setPrePolishDraft(null);
                    }}
                    placeholder="Tell potential clients about your experience, approach, and what makes you great at this..."
                    rows={6}
                    maxLength={2000}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all resize-none ${justPolished ? 'border-honey-400 ring-4 ring-honey-100' : 'border-charcoal-200'}`}
                  />
                  <CharacterLimitHint current={formData.description.length} max={2000} />
                  {fieldErrors.description && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAiRewrite}
                      disabled={isRewriting || formData.description.trim().length < 20}
                      className="group relative h-10 px-5 rounded-xl font-sans font-bold text-sm transition-all overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: isRewriting
                          ? 'linear-gradient(135deg, #d97706, #b45309)'
                          : 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
                        color: '#fff',
                        boxShadow: formData.description.trim().length >= 20
                          ? '0 0 20px rgba(245, 158, 11, 0.3), 0 0 6px rgba(217, 119, 6, 0.2)'
                          : 'none',
                      }}
                    >
                      <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                        <motion.span
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                            width: '60%',
                          }}
                          animate={{ x: ['-100%', '250%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                        />
                      </span>
                      <span className="relative flex items-center gap-2">
                        {isRewriting ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-block"
                            >
                              <Wand2 className="size-4" />
                            </motion.span>
                            Polishing…
                          </>
                        ) : (
                          <>
                            <Wand2 className="size-4 transition-transform group-hover:rotate-12" />
                            AI Polish
                          </>
                        )}
                      </span>
                    </button>

                    {prePolishDraft !== null && !isRewriting && (
                      <motion.button
                        type="button"
                        onClick={handleUndoPolish}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-10 px-4 rounded-xl font-sans font-bold text-sm border-2 border-charcoal-200 text-charcoal-600 hover:border-charcoal-300 hover:bg-charcoal-50 transition-all flex items-center gap-1.5"
                      >
                        <Undo2 className="size-3.5" />
                        Undo
                      </motion.button>
                    )}

                    <span className="text-xs text-charcoal-400">
                      {prePolishDraft !== null && !isRewriting
                        ? 'Not what you expected? Undo to restore your draft'
                        : 'Let AI sharpen your description'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-3">
                    What's Included
                  </label>
                  <div className="space-y-3">
                    {formData.included.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateIncludedItem(index, e.target.value)}
                            placeholder="e.g., 1-hour session, custom study materials"
                            maxLength={150}
                            className="w-full h-14 px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all"
                          />
                          <CharacterLimitHint current={item.length} max={150} />
                        </div>
                        {formData.included.length > 1 && (
                          <button
                            onClick={() => removeIncludedItem(index)}
                            className="size-10 flex items-center justify-center text-charcoal-400 hover:text-red-600 transition-colors"
                          >
                            <X className="size-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {formData.included.length >= 10 ? (
                      <span className="text-xs text-charcoal-400">Maximum 10 items</span>
                    ) : (
                      <button
                        type="button"
                        onClick={addIncludedItem}
                        className="text-sm text-honey-600 hover:text-honey-700 font-medium"
                      >
                        + Add another item
                      </button>
                    )}

                    <span className="text-charcoal-200">|</span>

                    <button
                      type="button"
                      onClick={handleSuggestIncluded}
                      disabled={isSuggestingIncluded || (!formData.title && !formData.category)}
                      className="group text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: '#b45309' }}
                    >
                      {isSuggestingIncluded ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block"
                          >
                            <ListPlus className="size-3.5" />
                          </motion.span>
                          Suggesting…
                        </>
                      ) : (
                        <>
                          <ListPlus className="size-3.5 transition-transform group-hover:scale-110" />
                          AI Suggest
                        </>
                      )}
                    </button>
                  </div>
                  {formData.included.length > 10 && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      Too many items — remove {formData.included.length - 10} to continue
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Adjust your price */}
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
                  Adjust your price
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Update your pricing to stay competitive
                </p>
              </div>

              <div className="bg-white border border-charcoal-200 rounded-2xl p-10 space-y-6 shadow-xl">
                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-3">
                    Pricing Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['hourly', 'flat', 'custom'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, pricingType: type })}
                        className={`h-16 rounded-xl border-2 font-sans font-bold text-sm transition-all ${
                          formData.pricingType === type
                            ? 'border-honey-500 bg-honey-50 text-charcoal-900 shadow-sm'
                            : 'border-charcoal-200 bg-white text-charcoal-600 hover:border-charcoal-300'
                        }`}
                      >
                        {type === 'hourly' && 'Hourly'}
                        {type === 'flat' && 'Flat Rate'}
                        {type === 'custom' && 'Custom'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                    {formData.pricingType === 'hourly' && 'Price per Hour'}
                    {formData.pricingType === 'flat' && 'Total Price'}
                    {formData.pricingType === 'custom' && (formData.customUnit ? `Price per ${formData.customUnit}` : 'Price')}
                  </label>
                  <CurrencyInput
                    value={formData.price}
                    onChange={(value) => setFormData({ ...formData, price: value })}
                    placeholder="0.00"
                    className="w-full h-14 pl-12 pr-4 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 text-lg placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all"
                  />
                  {fieldErrors.price && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {fieldErrors.price}
                    </p>
                  )}
                </div>

                {formData.pricingType === 'custom' && (
                  <div>
                    <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                      Price Unit
                    </label>
                    <input
                      type="text"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      placeholder="e.g., page, session, mile, lesson"
                      maxLength={50}
                      className="w-full h-14 px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all"
                    />
                    <CharacterLimitHint current={formData.customUnit.length} max={50} />
                    <p className="mt-2 text-xs text-charcoal-500">
                      What unit is this price per? Leave blank for a flat starting price.
                    </p>
                  </div>
                )}

                {priceHint && (
                  <div className="flex items-center gap-2 text-sm text-charcoal-500 bg-honey-50 border border-honey-200 rounded-lg p-3">
                    <Sparkles className="size-4 text-honey-600 shrink-0" />
                    <span>Similar {formData.category} services charge ⬡{priceHint.min}–{priceHint.max}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Update photos */}
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
                  Update photos
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Add or replace images to keep your listing fresh
                </p>
              </div>

              <div className="bg-white border border-charcoal-100 rounded-xl p-8 space-y-6 shadow-md">
                {formData.images.length === 0 ? (
                  /* Upload Area */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-charcoal-200 rounded-xl p-12 text-center hover:border-honey-500 hover:bg-honey-50/50 transition-all cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={SERVICE_IMAGE_ACCEPT}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="size-12 text-charcoal-300 mx-auto mb-4" />
                    <p className="font-sans font-bold text-charcoal-900 mb-1">
                      Click to upload a cover image
                    </p>
                    <p className="text-sm text-charcoal-500">
                      {SUPPORTED_IMAGE_COPY} up to 5MB
                    </p>
                  </div>
                ) : (
                  /* Image Preview */
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-honey-400">
                      {canPreviewImage ? (
                        <img src={formData.images[0]} alt="Cover image" className="w-full h-full" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-honey-100 to-cream-100 text-center">
                          <div>
                            <Upload className="mx-auto mb-2 size-8 text-honey-600" />
                            <p className="text-sm font-semibold text-charcoal-900">HEIC photo selected</p>
                            <p className="text-xs text-charcoal-500">It will be converted after upload.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-4 bg-charcoal-100 text-charcoal-700 rounded-lg text-sm font-bold hover:bg-charcoal-200 transition-colors"
                      >
                        Replace image
                      </button>
                      <button
                        onClick={removeImage}
                        className="h-9 px-4 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={SERVICE_IMAGE_ACCEPT}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Preview Card */}
                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-3">
                    Preview: How your card will look
                  </h3>
                  <div className="bg-cream-50 border border-charcoal-200 rounded-xl p-6 space-y-4">
                    {formData.images.length > 0 && canPreviewImage ? (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img src={formData.images[0]} alt="Service preview" className="w-full h-full" style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-honey-100 to-honey-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Upload className="size-8 text-honey-600 mx-auto mb-2" />
                          <p className="text-sm text-honey-700">
                            {formData.images.length > 0 ? 'HEIC preview will appear after upload' : 'Your photo will appear here'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-sans font-bold text-lg text-charcoal-900">
                        {formData.title || 'Your Service Title'}
                      </h4>
                      <p className="text-sm text-charcoal-600 mt-1 line-clamp-2">
                        {formData.description || 'Your description will appear here...'}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="inline-block px-3 py-1 bg-honey-100 text-honey-700 text-xs font-medium rounded-full">
                          {formData.category || 'Category'}
                        </span>
                        <span className="font-mono text-lg text-charcoal-900">
                          ⬡ {formData.price || '0'}{formData.pricingType === 'flat' ? '' : `/${formData.pricingType === 'hourly' ? 'hr' : (formData.customUnit || 'session')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Review & Save Changes */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display italic text-4xl md:text-5xl text-charcoal-900 mb-3">
                  Review your changes
                </h1>
                <p className="text-charcoal-600 text-lg">
                  Make sure everything looks good before saving
                </p>
              </div>

              {/* Full Preview */}
              <div className="bg-white border-2 border-honey-400/30 rounded-xl overflow-hidden relative shadow-xl">
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

                {/* Header Image */}
                {formData.images.length > 0 && canPreviewImage ? (
                  <div className="aspect-[2/1] overflow-hidden">
                    <img src={formData.images[0]} alt="Service cover" className="w-full h-full" style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="aspect-[2/1] bg-gradient-to-br from-honey-200 to-honey-400 flex items-center justify-center">
                    <div className="text-center">
                      <div className="size-20 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">✨</span>
                      </div>
                      <p className="text-honey-800 font-medium">
                        {formData.images.length > 0 ? 'HEIC photo selected' : 'Your service cover image'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-8 space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="font-display italic text-3xl text-charcoal-900">
                        {formData.title || 'Your Service Title'}
                      </h2>
                      <span className="inline-block px-4 py-1.5 bg-honey-100 text-honey-700 text-sm font-medium rounded-full shrink-0">
                        {formData.category || 'Category'}
                      </span>
                    </div>
                    <div className="space-y-2 text-charcoal-600 leading-relaxed">
                      {(formData.description || 'Your service description...').split(/\n\s*\n/).map((paragraph, i) => {
                        const trimmed = paragraph.trim();
                        return trimmed ? <p key={i}>{trimmed}</p> : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-3">
                      What's Included:
                    </h3>
                    <ul className="space-y-2">
                      {formData.included
                        .filter((item) => item.trim())
                        .map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700">
                            <Check className="size-4 text-green-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-charcoal-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-charcoal-500 mb-1">
                        {formData.pricingType === 'hourly' && 'Hourly Rate'}
                        {formData.pricingType === 'flat' && 'Total Price'}
                        {formData.pricingType === 'custom' && (formData.customUnit ? `Per ${formData.customUnit}` : 'Starting at')}
                      </div>
                      <div className="font-mono text-3xl text-charcoal-900">
                        ⬡ {formData.price || '0'}
                      </div>
                    </div>
                    <button className="h-12 px-8 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold transition-all hover:bg-honey-600">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Changes Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-16 bg-gradient-to-r from-honey-500 to-honey-600 text-charcoal-900 rounded-xl font-sans font-bold text-lg transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-charcoal-900 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-5" />
                    Save Changes
                  </>
                )}
              </button>

              {/* Delete Section */}
              <div className="pt-6 border-t border-charcoal-200">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full h-12 bg-red-50 border border-red-200 text-red-700 rounded-xl font-sans font-bold text-sm transition-all hover:bg-red-100 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="size-4" />
                    Delete This Service
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans font-bold text-sm text-red-900">
                          Are you sure you want to delete this service?
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          This action cannot be undone. All bookings and data associated with this service will be permanently removed.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-11 px-6 bg-red-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <motion.div
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-4" />
                            Yes, Delete Permanently
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="h-11 px-6 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
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

          {currentStep < 5 && (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!formData.title || !formData.category)) ||
                (currentStep === 2 && (!formData.description || formData.included.length > 10)) ||
                (currentStep === 3 && !formData.price)
              }
              className={`h-14 px-8 rounded-xl font-sans font-bold text-base transition-all flex items-center gap-2 ${
                (currentStep === 1 && (!formData.title || !formData.category)) ||
                (currentStep === 2 && (!formData.description || formData.included.length > 10)) ||
                (currentStep === 3 && !formData.price)
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
