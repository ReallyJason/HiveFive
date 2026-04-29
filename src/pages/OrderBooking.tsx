import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { DatePicker } from '../components/DatePicker';
import { TimePicker } from '../components/TimePicker';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../lib/auth';
import { apiGet, apiPost, ApiError } from '../lib/api';
import { MessageCircle, AlertCircle, Check, CreditCard, Loader2 } from 'lucide-react';
import { toUTCBooking, formatSchedule } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  pricing_type: 'hourly' | 'flat' | 'custom';
  custom_price_unit: string | null;
  price_unit: string | null;
  provider_id: number;
  provider_first_name: string;
  provider_last_name: string;
  provider_username: string;
  provider_profile_image: string | null;
  rating: number;
  review_count: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function unitStepForService(service: Service | null): number {
  return service?.pricing_type === 'hourly' ? 0.5 : 1;
}

function minimumUnitsForService(service: Service | null): number {
  return service?.pricing_type === 'hourly' ? 0.5 : 1;
}

function formatMoney(value: number): string {
  return roundMoney(value).toFixed(2);
}

function displayUnit(unit: string | null | undefined, amount = 2): string {
  if (!unit) return amount === 1 ? 'unit' : 'units';
  if (unit === 'hr') return amount === 1 ? 'hour' : 'hours';
  if (amount === 1) return unit;
  return unit.endsWith('s') ? unit : `${unit}s`;
}

function formatUnits(amount: number, unit: string | null | undefined): string {
  const normalized = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${normalized} ${displayUnit(unit, amount)}`;
}

export function OrderBooking() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') || '';
  const initialDate = searchParams.get('date') || '';
  const initialTime = searchParams.get('time') || '';

  // --- Service fetch state ---
  const [service, setService] = useState<Service | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // --- Form state ---
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [formData, setFormData] = useState({
    date: initialDate,
    time: initialTime,
    requestedUnits: '1',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Fetch service details ---
  useEffect(() => {
    if (!serviceId) {
      setServiceError('No service ID provided');
      setServiceLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setServiceLoading(true);
      setServiceError(null);
      try {
        const data = await apiGet<{ service: Service }>('/services/get.php', { id: serviceId });
        if (!cancelled) setService(data.service);
      } catch (err) {
        if (!cancelled) {
          setServiceError(err instanceof ApiError ? err.message : 'Failed to load service');
        }
      } finally {
        if (!cancelled) setServiceLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [serviceId]);

  // --- Derived pricing ---
  const usesUnitPricing = Boolean(service?.price_unit);
  const unitStep = unitStepForService(service);
  const minUnits = minimumUnitsForService(service);
  const requestedUnitsValue = usesUnitPricing
    ? Number.parseFloat(formData.requestedUnits || '')
    : 1;
  const requestedUnits = Number.isFinite(requestedUnitsValue) ? requestedUnitsValue : minUnits;
  const priceNumber = service?.price ?? 0;
  const subtotal = roundMoney(priceNumber * requestedUnits);
  const serviceFee = roundMoney(subtotal * 0.10);
  const total = roundMoney(subtotal + serviceFee);
  const providerName = service
    ? `${service.provider_first_name} ${service.provider_last_name}`
    : '';
  const quantityLabel = usesUnitPricing ? formatUnits(requestedUnits, service?.price_unit) : null;
  const rateLabel = service?.price_unit
    ? `⬡ ${formatMoney(priceNumber)} / ${displayUnit(service.price_unit, 1)}`
    : `⬡ ${formatMoney(priceNumber)}`;

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = 'Please select a date';
    if (!formData.time) newErrors.time = 'Please select a time';
    if (usesUnitPricing) {
      if (!Number.isFinite(requestedUnitsValue)) {
        newErrors.requestedUnits = 'Enter a valid quantity';
      } else {
        const normalized = Math.round(requestedUnitsValue / unitStep) * unitStep;
        if (requestedUnitsValue < minUnits || Math.abs(normalized - requestedUnitsValue) > 0.001) {
          newErrors.requestedUnits = service?.pricing_type === 'hourly'
            ? 'Enter hours in 0.5 increments'
            : `Enter ${displayUnit(service?.price_unit, 2)} in whole increments`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateDetails()) {
      setStep('confirm');
    }
  };

  const handleConfirmBooking = async () => {
    if (!service) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await apiPost('/orders/create.php', {
        service_id: service.id,
        scheduled_date: formData.date,
        scheduled_time: formData.time,
        scheduled_utc: formData.date && formData.time
          ? toUTCBooking(formData.date, formData.time)
          : undefined,
        requested_units: usesUnitPricing ? requestedUnits : undefined,
        notes: formData.notes || undefined,
      });
      // Refresh user to get updated balance
      await refreshUser();
      setStep('success');
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to create booking');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Loading / Error states for service fetch ---
  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="size-8 text-charcoal-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-2xl mx-auto px-5 sm:px-6 md:px-16 pt-16 pb-16">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
            <h1 className="font-display italic text-2xl text-charcoal-900 mb-2">
              Service Not Found
            </h1>
            <p className="text-charcoal-600 mb-6">{serviceError || 'Unable to load this service.'}</p>
            <button
              onClick={() => navigate('/discover')}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Browse Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Success screen ---
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-2xl mx-auto px-5 sm:px-6 md:px-16 pt-16 pb-16">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <div className="size-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="size-8 text-white" />
            </div>
            <h1 className="font-display italic text-3xl text-charcoal-900 mb-3">
              Booking Confirmed!
            </h1>
            <p className="text-charcoal-600 mb-8">
              Your {usesUnitPricing && quantityLabel ? `${quantityLabel} order with ${providerName}` : `session with ${providerName}`} is scheduled for {formatSchedule(
                formData.date && formData.time ? toUTCBooking(formData.date, formData.time) : null,
                formData.date, formData.time,
              )?.full ?? 'TBD'}.
              Check your email for confirmation details.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/orders')}
                className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
              >
                View My Orders
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams({ userId: String(service!.provider_id) });
                  params.set('ctxType', 'service');
                  params.set('ctxId', String(service!.id));
                  params.set('ctxTitle', service!.title);
                  navigate(`/messages?${params.toString()}`);
                }}
                className="h-11 px-6 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                Message Provider
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-8">
          Book Service
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'details' && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <h2 className="text-xl font-display italic text-charcoal-900 mb-6">
                  Order Details
                </h2>

                {usesUnitPricing && (
                  <div className="mb-6">
                    <label className="block font-sans font-bold text-charcoal-900 mb-2">
                      How many {displayUnit(service.price_unit, 2)} should this order cover right now? *
                    </label>
                    <input
                      type="number"
                      min={minUnits}
                      step={unitStep}
                      value={formData.requestedUnits}
                      onChange={(e) => setFormData({ ...formData, requestedUnits: e.target.value })}
                      className="w-full h-12 px-4 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                    />
                    <p className="mt-2 text-xs text-charcoal-500">
                      You pay for the amount you approve now. If the job grows later, the provider can request more budget.
                    </p>
                    {errors.requestedUnits && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="size-4" />
                        {errors.requestedUnits}
                      </p>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="mb-6">
                  <label className="block font-sans font-bold text-charcoal-900 mb-2">
                    Select Date *
                  </label>
                  <DatePicker
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    placeholder="Choose a date"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-4" />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div className="mb-6">
                  <label className="block font-sans font-bold text-charcoal-900 mb-2">
                    Select Time *
                  </label>
                  <TimePicker
                    value={formData.time}
                    onChange={(time) => setFormData({ ...formData, time })}
                    selectedDate={formData.date}
                    placeholder="Choose a time"
                  />
                  {errors.time && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="size-4" />
                      {errors.time}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block font-sans font-bold text-charcoal-900 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific requirements or questions for the provider..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-cream-50 border border-charcoal-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-honey-500"
                  />
                  <CharacterLimitHint current={formData.notes.length} max={500} />
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full h-12 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold transition-all hover:bg-honey-600"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 'confirm' && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <h2 className="text-xl font-display italic text-charcoal-900 mb-6">
                  Confirm & Pay
                </h2>

                {/* Booking Summary */}
                <div className="bg-cream-50 rounded-lg p-4 mb-6">
                  <h3 className="font-sans font-bold text-charcoal-900 mb-3">
                    Booking Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    {usesUnitPricing && quantityLabel && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-charcoal-600">Quantity:</span>
                          <span className="text-charcoal-900 font-medium">{quantityLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-charcoal-600">Rate:</span>
                          <span className="text-charcoal-900 font-medium">{rateLabel}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Date:</span>
                      <span className="text-charcoal-900 font-medium">
                        {formatSchedule(
                          formData.date && formData.time ? toUTCBooking(formData.date, formData.time) : null,
                          formData.date, formData.time,
                        )?.date ?? 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Time:</span>
                      <span className="text-charcoal-900 font-medium">
                        {formatSchedule(
                          formData.date && formData.time ? toUTCBooking(formData.date, formData.time) : null,
                          formData.date, formData.time,
                        )?.time || formData.time}
                      </span>
                    </div>
                    {formData.notes && (
                      <div className="pt-2 border-t border-charcoal-100">
                        <span className="text-charcoal-600">Notes:</span>
                        <p className="text-charcoal-900 mt-1">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-sans font-bold text-charcoal-900 mb-3">
                    Payment Method
                  </h3>
                  <div className="border border-charcoal-200 rounded-lg p-4 bg-cream-50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="size-5 text-honey-700" />
                      </div>
                      <div className="flex-1">
                        <div className="font-sans font-bold text-charcoal-900">
                          HiveCoin Balance
                        </div>
                        <div className="text-sm text-charcoal-600">
                          Current balance: {'\u2B21'} {user?.hivecoin_balance?.toLocaleString() ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  {user && user.hivecoin_balance < total && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="size-4" />
                      Insufficient HiveCoin balance. You need {'\u2B21'} {formatMoney(total)} but have {'\u2B21'} {formatMoney(user.hivecoin_balance)}.
                    </p>
                  )}
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('details'); setSubmitError(null); }}
                    className="px-6 h-12 bg-charcoal-100 text-charcoal-900 rounded-lg font-sans font-bold transition-all hover:bg-charcoal-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={submitLoading || (!!user && user.hivecoin_balance < total)}
                    className="flex-1 h-12 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold transition-all hover:bg-honey-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitLoading && <Loader2 className="size-5 animate-spin" />}
                    Confirm Booking
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-charcoal-100 rounded-xl p-6 sticky top-8">
              <h3 className="font-sans font-bold text-charcoal-900 mb-4">
                Order Summary
              </h3>

              {/* Service Info */}
              <div className="mb-4 pb-4 border-b border-charcoal-100">
                <h4 className="font-sans font-bold text-charcoal-900 mb-2">
                  {service.title}
                </h4>
                <div className="flex items-center gap-2">
                  <Avatar name={providerName} size="sm" src={service.provider_profile_image} />
                  <span className="text-sm text-charcoal-600">{providerName}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                {usesUnitPricing && quantityLabel && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal-600">Authorized quantity</span>
                      <span className="text-charcoal-900">{quantityLabel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal-600">Rate</span>
                      <span className="text-charcoal-900 font-mono">{rateLabel}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">{usesUnitPricing ? 'Subtotal' : 'Service price'}</span>
                  <span className="text-charcoal-900 font-mono">{'\u2B21'} {formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-600">Service fee (10%)</span>
                  <span className="text-charcoal-900 font-mono">{'\u2B21'} {formatMoney(serviceFee)}</span>
                </div>
                <div className="pt-3 border-t border-charcoal-100">
                  <div className="flex justify-between">
                    <span className="font-sans font-bold text-charcoal-900">Due now</span>
                    <span className="font-mono text-xl text-charcoal-900">{'\u2B21'} {formatMoney(total)}</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-honey-50 border border-honey-200 rounded-lg p-3">
                <p className="text-xs text-charcoal-700">
                  <strong>Protected payment:</strong> Your payment stays protected until the service is completed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
