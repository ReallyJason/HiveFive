import { useState, useEffect, useCallback } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { CurrencyInput } from '../components/CurrencyInput';
import { StatusBadge } from '../components/StatusBadge';
import { useNavigate, useParams, Link } from 'react-router';
import { useAuth } from '../lib/auth';
import { apiGet, apiPatch, apiPost, ApiError } from '../lib/api';
import { toast } from 'sonner';
import {
  Clock,
  MessageCircle,
  FileText,
  Star,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Timer,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { formatSchedule, parseUTC } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

interface CosmeticsPayload {
  frame: { gradient: string; glow: string; css_animation: string | null; ring_size: number } | null;
  badge: { tag: string; bg_color: string; text_color: string; bg_gradient: string | null; css_animation: string | null } | null;
}

interface OtherParty {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  profile_image?: string | null;
  cosmetics?: CosmeticsPayload;
}

interface PendingAdjustment {
  id: number;
  order_id: number;
  requested_by: number;
  responded_by: number | null;
  units_delta: number;
  subtotal_delta: number;
  service_fee_delta: number;
  total_delta: number;
  note: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  requested_by_name: string | null;
}

interface Order {
  id: number;
  service_title: string;
  service_category: string;
  client_id: number;
  provider_id: number;
  pricing_type_snapshot: 'hourly' | 'flat' | 'custom';
  unit_label_snapshot: string | null;
  unit_rate: number;
  requested_units: number;
  authorized_units: number;
  actual_units: number | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_utc: string | null;
  price: number;
  service_fee: number;
  total: number;
  settlement_subtotal: number | null;
  settlement_service_fee: number | null;
  settlement_total: number | null;
  refunded_amount: number;
  tip_amount: number;
  tipped_at: string | null;
  other_party: OtherParty;
  created_at: string;
  client_completed_at: string | null;
  provider_completed_at: string | null;
  auto_complete_at: string | null;
  disputed_at: string | null;
  disputed_by: number | null;
  dispute_reason: string | null;
  dispute_resolution_deadline: string | null;
  proposed_split_by: number | null;
  proposed_split_provider_pct: number | null;
  has_review?: boolean;
  has_client_review?: boolean;
  pending_adjustment?: PendingAdjustment | null;
}

type OrderViewType = 'buyer' | 'seller';

const TIP_PRESET_PCTS = [10, 20, 30] as const;
const MIN_TIP_AMOUNT = 0.1;

function timeUntil(dateStr: string): string {
  const target = parseUTC(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return 'any moment now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function parseMoneyAmount(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

function parseUnitsAmount(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100) / 100;
}

function formatMoneyAmount(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function isUnitPricedOrder(order: Order): boolean {
  return Boolean(order.unit_label_snapshot);
}

function unitStepForOrder(order: Order): number {
  return order.pricing_type_snapshot === 'hourly' ? 0.5 : 1;
}

function minimumUnitsForOrder(order: Order): number {
  return order.pricing_type_snapshot === 'hourly' ? 0.5 : 1;
}

function displayUnitName(unitLabel: string | null | undefined, amount = 2): string {
  if (!unitLabel) return amount === 1 ? 'unit' : 'units';
  if (unitLabel === 'hr') return amount === 1 ? 'hour' : 'hours';
  if (amount === 1) return unitLabel;
  return unitLabel.endsWith('s') ? unitLabel : `${unitLabel}s`;
}

function formatUnitsLabel(amount: number, unitLabel: string | null | undefined): string {
  const normalized = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${normalized} ${displayUnitName(unitLabel, amount)}`;
}

function settlementBasis(order: Order) {
  if (
    order.settlement_subtotal !== null
    && order.settlement_service_fee !== null
    && order.settlement_total !== null
  ) {
    return {
      subtotal: order.settlement_subtotal,
      service_fee: order.settlement_service_fee,
      total: order.settlement_total,
    };
  }

  return {
    subtotal: order.price,
    service_fee: order.service_fee,
    total: order.total,
  };
}

function providerAmountForSplit(order: Order, pct: number): number {
  return parseMoneyAmount(String(settlementBasis(order).subtotal * (pct / 100)));
}

function refundAmountForSplit(order: Order, pct: number): number {
  const basis = settlementBasis(order);
  return parseMoneyAmount(String(Math.max(0, order.total - providerAmountForSplit(order, pct) - basis.service_fee)));
}

function getTipCap(price: number): number {
  return Math.round(price * (price > 100 ? 50 : 100)) / 100;
}

function getPresetTipAmount(price: number, pct: number): number {
  const cap = getTipCap(price);
  return Math.min(cap, Math.max(MIN_TIP_AMOUNT, Math.round(price * pct) / 100));
}

export function OrderTracking() {
  const navigate = useNavigate();
  const { orderId: orderIdParam } = useParams<{ orderId?: string }>();
  const focusedOrderId = orderIdParam ? Number(orderIdParam) : null;
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  // --- Data state ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- UI state ---
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // --- Dispute UI state ---
  const [disputeOrderId, setDisputeOrderId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [splitOrderId, setSplitOrderId] = useState<number | null>(null);
  const [splitPct, setSplitPct] = useState(50);

  // --- Review UI state (client → provider) ---
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<number>>(new Set());

  // --- Tip UI state (client → provider) ---
  const [tipOrderId, setTipOrderId] = useState<number | null>(null);
  const [tipAmount, setTipAmount] = useState('0');

  // --- Unit pricing UI state ---
  const [adjustmentOrderId, setAdjustmentOrderId] = useState<number | null>(null);
  const [adjustmentUnits, setAdjustmentUnits] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [completionOrderId, setCompletionOrderId] = useState<number | null>(null);
  const [completionUnits, setCompletionUnits] = useState('');

  // --- Client review UI state (provider → client) ---
  const [clientReviewOrderId, setClientReviewOrderId] = useState<number | null>(null);
  const [clientReviewRating, setClientReviewRating] = useState(0);
  const [clientReviewHover, setClientReviewHover] = useState(0);
  const [clientReviewComment, setClientReviewComment] = useState('');
  const [clientReviewedOrderIds, setClientReviewedOrderIds] = useState<Set<number>>(new Set());

  // --- Fetch orders ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ orders: Order[] }>('/orders/list.php');
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Merge API order response into existing order, preserving joined fields
  // (API responses from update/dispute endpoints don't include other_party, service_title, etc.)
  const mergeOrder = (existing: Order, updated: Partial<Order>): Order => ({
    ...existing,
    ...updated,
    other_party: existing.other_party,
    service_title: existing.service_title ?? updated.service_title ?? '',
    service_category: existing.service_category ?? updated.service_category ?? '',
  });

  const safeRefreshUser = async () => {
    try {
      await refreshUser();
    } catch {
      // Balance refresh can recover on the next auth poll.
    }
  };

  // --- Status update handler (two-sided completion) ---
  const handleStatusUpdate = async (orderId: number, newStatus: string, extraBody?: Record<string, unknown>) => {
    setUpdatingId(orderId);
    try {
      const data = await apiPatch<{ order: Order }>(`/orders/update-status.php?id=${orderId}`, {
        status: newStatus,
        ...extraBody,
      });
      const resultStatus = data.order.status;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? mergeOrder(o, data.order) : o)));
      if (newStatus === 'completed') {
        if (resultStatus === 'completed') {
          await safeRefreshUser();
          toast.success('Order completed! Payment released.');
        } else {
          toast.success('Marked as complete. Waiting for the other party to confirm.');
        }
      } else if (newStatus === 'in_progress') {
        toast.success('Order started!');
      } else if (newStatus === 'cancelled') {
        await safeRefreshUser();
        toast.success('Order cancelled. Refund issued.');
      }
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update order');
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Dispute handlers ---
  const handleRaiseDispute = async (orderId: number) => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    setUpdatingId(orderId);
    try {
      const data = await apiPost<{ order: Order }>(`/orders/dispute.php?id=${orderId}`, {
        reason: disputeReason.trim(),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? mergeOrder(o, data.order) : o)));
      setDisputeOrderId(null);
      setDisputeReason('');
      toast.success('Dispute raised. The other party has been notified.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to raise dispute');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProposeSplit = async (orderId: number) => {
    setUpdatingId(orderId);
    try {
      const data = await apiPatch<{ order: Order }>(`/orders/dispute.php?id=${orderId}`, {
        action: 'propose_split',
        provider_pct: splitPct,
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? mergeOrder(o, data.order) : o)));
      setSplitOrderId(null);
      toast.success('Split proposal sent!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to propose split');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptSplit = async (orderId: number) => {
    setUpdatingId(orderId);
    try {
      const data = await apiPatch<{ order: Order }>(`/orders/dispute.php?id=${orderId}`, {
        action: 'accept_split',
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? mergeOrder(o, data.order) : o)));
      await safeRefreshUser();
      toast.success('Split accepted! Payment distributed.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to accept split');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWithdrawDispute = async (orderId: number) => {
    setUpdatingId(orderId);
    try {
      const data = await apiPatch<{ order: Order }>(`/orders/dispute.php?id=${orderId}`, {
        action: 'withdraw_dispute',
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? mergeOrder(o, data.order) : o)));
      await safeRefreshUser();
      toast.success('Dispute withdrawn. Order completed.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to withdraw dispute');
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Review handler ---
  const handleSubmitReview = async (orderId: number) => {
    if (reviewRating < 1) {
      toast.error('Please select a rating');
      return;
    }
    setUpdatingId(orderId);
    try {
      await apiPost('/orders/review.php', {
        order_id: orderId,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });
      setReviewedOrderIds((prev) => new Set(prev).add(orderId));
      setReviewOrderId(null);
      setReviewRating(0);
      setReviewComment('');
      toast.success('Review submitted! Thanks for your feedback.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setReviewedOrderIds((prev) => new Set(prev).add(orderId));
        setReviewOrderId(null);
        toast.error('You already reviewed this order');
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to submit review');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const closeTipComposer = () => {
    setTipOrderId(null);
    setTipAmount('0');
  };

  const openTipComposer = (orderId: number) => {
    setTipOrderId(orderId);
    setTipAmount('0');
    setReviewOrderId(null);
    setReviewRating(0);
    setReviewHover(0);
    setReviewComment('');
  };

  const handleTipPresetSelect = (order: Order, pct: number) => {
    setTipAmount(formatMoneyAmount(getPresetTipAmount(order.price, pct)));
  };

  const closeAdjustmentComposer = () => {
    setAdjustmentOrderId(null);
    setAdjustmentUnits('');
    setAdjustmentNote('');
  };

  const openAdjustmentComposer = (order: Order) => {
    setAdjustmentOrderId(order.id);
    setAdjustmentUnits(String(unitStepForOrder(order)));
    setAdjustmentNote('');
    setCompletionOrderId(null);
    setCompletionUnits('');
  };

  const handleRequestAdjustment = async (order: Order) => {
    const parsedUnits = parseUnitsAmount(adjustmentUnits);
    const step = unitStepForOrder(order);
    const min = minimumUnitsForOrder(order);

    if (
      parsedUnits === null
      || parsedUnits <= 0
      || parsedUnits < min
      || Math.abs(Math.round(parsedUnits / step) * step - parsedUnits) > 0.001
    ) {
      toast.error(order.pricing_type_snapshot === 'hourly' ? 'Enter hours in 0.5 increments.' : 'Enter a valid additional quantity.');
      return;
    }

    setUpdatingId(order.id);
    try {
      const data = await apiPost<{ order: Order; pending_adjustment: PendingAdjustment | null }>(
        `/orders/adjustment.php?id=${order.id}`,
        {
          units_delta: parsedUnits,
          note: adjustmentNote.trim() || undefined,
        },
      );
      setOrders((prev) => prev.map((o) => (
        o.id === order.id
          ? { ...mergeOrder(o, data.order), pending_adjustment: data.pending_adjustment }
          : o
      )));
      closeAdjustmentComposer();
      toast.success('More budget request sent.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to request more budget');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRespondToAdjustment = async (order: Order, action: 'accept' | 'decline') => {
    setUpdatingId(order.id);
    try {
      const data = await apiPatch<{ order: Order; pending_adjustment: PendingAdjustment | null }>(
        `/orders/adjustment.php?id=${order.id}`,
        { action },
      );
      setOrders((prev) => prev.map((o) => (
        o.id === order.id
          ? { ...mergeOrder(o, data.order), pending_adjustment: data.pending_adjustment }
          : o
      )));
      if (action === 'accept') {
        await safeRefreshUser();
        toast.success('Extra budget approved.');
      } else {
        toast.success('Extra budget request declined.');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to respond to the scope change');
    } finally {
      setUpdatingId(null);
    }
  };

  const closeCompletionComposer = () => {
    setCompletionOrderId(null);
    setCompletionUnits('');
  };

  const openCompletionComposer = (order: Order) => {
    setCompletionOrderId(order.id);
    setCompletionUnits(String(order.authorized_units));
    closeAdjustmentComposer();
  };

  const handleSubmitCompletion = async (order: Order) => {
    const parsedUnits = parseUnitsAmount(completionUnits);
    const step = unitStepForOrder(order);
    const min = minimumUnitsForOrder(order);

    if (
      parsedUnits === null
      || parsedUnits < min
      || Math.abs(Math.round(parsedUnits / step) * step - parsedUnits) > 0.001
    ) {
      toast.error(order.pricing_type_snapshot === 'hourly' ? 'Enter hours in 0.5 increments.' : 'Enter a valid final quantity.');
      return;
    }

    if (parsedUnits > order.authorized_units) {
      toast.error('Final quantity is above the approved amount. Request more budget first.');
      return;
    }

    const success = await handleStatusUpdate(order.id, 'completed', { actual_units: parsedUnits });
    if (success) {
      closeCompletionComposer();
    }
  };

  const handleSubmitTip = async (order: Order) => {
    const amount = parseMoneyAmount(tipAmount);
    const tipCap = getTipCap(order.price);

    if (amount < MIN_TIP_AMOUNT || amount > tipCap) {
      toast.error('Enter a valid tip amount.');
      return;
    }

    setUpdatingId(order.id);
    try {
      const data = await apiPost<{ order: Order }>('/orders/tip.php', {
        order_id: order.id,
        amount,
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? mergeOrder(o, data.order) : o)));
      closeTipComposer();
      await safeRefreshUser();
      toast.success('Tip sent.');
    } catch (err) {
      const errorData =
        err instanceof ApiError && err.data && typeof err.data === 'object'
          ? (err.data as { order?: Order })
          : null;

      if (errorData?.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? mergeOrder(o, errorData.order as Order) : o)));
        closeTipComposer();
      }

      toast.error(err instanceof ApiError ? err.message : 'Failed to send tip');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderTipUi = (order: Order, type: OrderViewType, otherPartyName: string, isUpdating: boolean) => {
    if (order.status !== 'completed') return null;

    const tipCap = getTipCap(order.price);
    const draftAmount = parseMoneyAmount(tipAmount);
    const draftMatchesPreset = (pct: number) =>
      formatMoneyAmount(getPresetTipAmount(order.price, pct)) === formatMoneyAmount(draftAmount);

    return (
      <>
        {order.tip_amount > 0 && (
          <TipSummary
            amount={order.tip_amount}
            tippedAt={order.tipped_at}
            type={type}
            otherPartyName={otherPartyName}
          />
        )}

        {type === 'buyer' && order.tip_amount === 0 && tipCap >= MIN_TIP_AMOUNT && (
          <>
            {tipOrderId === order.id ? (
              <TipComposer
                amount={tipAmount}
                disabled={isUpdating}
                draftValid={draftAmount >= MIN_TIP_AMOUNT && draftAmount <= tipCap}
                onAmountChange={setTipAmount}
                onCancel={closeTipComposer}
                onPresetSelect={(pct) => handleTipPresetSelect(order, pct)}
                onSubmit={() => handleSubmitTip(order)}
                otherPartyName={otherPartyName}
                presetMatches={draftMatchesPreset}
                tipCap={tipCap}
              />
            ) : (
              <button
                onClick={() => openTipComposer(order.id)}
                className="h-9 px-4 bg-emerald-100 text-emerald-800 rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-200"
              >
                Add Tip
              </button>
            )}
          </>
        )}
      </>
    );
  };

  // --- Client review handler (provider → client) ---
  const handleSubmitClientReview = async (orderId: number) => {
    if (clientReviewRating < 1) {
      toast.error('Please select a rating');
      return;
    }
    setUpdatingId(orderId);
    try {
      await apiPost('/orders/client-review.php', {
        order_id: orderId,
        rating: clientReviewRating,
        comment: clientReviewComment.trim() || null,
      });
      setClientReviewedOrderIds((prev) => new Set(prev).add(orderId));
      setClientReviewOrderId(null);
      setClientReviewRating(0);
      setClientReviewComment('');
      toast.success('Client review submitted! Thanks for your feedback.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setClientReviewedOrderIds((prev) => new Set(prev).add(orderId));
        setClientReviewOrderId(null);
        toast.error('You already reviewed this client');
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to submit review');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Derived lists ---
  const activeStatuses = ['pending', 'in_progress', 'awaiting_completion', 'disputed'];
  const activeOrdersList = orders.filter((o) => activeStatuses.includes(o.status));
  const completedOrdersList = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  // Single-order view when navigated via /orders/:orderId
  const focusedOrder = focusedOrderId ? orders.find((o) => o.id === focusedOrderId) : null;

  const currentOrders = activeTab === 'active' ? activeOrdersList : completedOrdersList;
  const filteredOrders = currentOrders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const otherName = `${order.other_party.first_name} ${order.other_party.last_name}`;
    return (
      order.service_title.toLowerCase().includes(query) ||
      otherName.toLowerCase().includes(query)
    );
  });

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="h-7 w-48 bg-charcoal-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-charcoal-100 rounded animate-pulse" />
          </div>
          {/* Search bar skeleton */}
          <div className="h-10 w-full bg-charcoal-100 rounded-lg animate-pulse mb-4" />
          {/* Tabs skeleton */}
          <div className="flex gap-3 mb-6">
            <div className="h-9 w-24 bg-charcoal-100 rounded-full animate-pulse" />
            <div className="h-9 w-24 bg-charcoal-100 rounded-full animate-pulse" />
          </div>
          {/* Order cards skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-5 w-20 bg-charcoal-100 rounded-full animate-pulse mb-3" />
                    <div className="h-5 w-48 bg-charcoal-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-36 bg-charcoal-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-charcoal-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-2xl mx-auto px-5 sm:px-6 md:px-16 pt-16 pb-16">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
            <h1 className="font-display italic text-2xl text-charcoal-900 mb-2">
              Failed to Load Orders
            </h1>
            <p className="text-charcoal-600 mb-6">{error}</p>
            <button
              onClick={fetchOrders}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Focused single-order view ---
  if (focusedOrderId) {
    if (!focusedOrder) {
      return (
        <div className="min-h-screen bg-cream-50">
          <NavBar variant="logged-in" />
          <div className="max-w-2xl mx-auto px-5 sm:px-6 md:px-16 pt-16 pb-16">
            <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
              <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
              <h1 className="font-display italic text-2xl text-charcoal-900 mb-2">
                Order Not Found
              </h1>
              <p className="text-charcoal-600 mb-6">
                Order #{focusedOrderId} doesn't exist or you don't have access to it.
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 inline-flex items-center gap-2"
              >
                <ArrowLeft className="size-4" />
                All Orders
              </button>
            </div>
          </div>
        </div>
      );
    }

    const order = focusedOrder;
    const type = order.client_id === user?.id ? 'buyer' : 'seller';
    const isProvider = user?.id === order.provider_id;
    const otherPartyName = `${order.other_party.first_name} ${order.other_party.last_name}`;
    const isUpdating = updatingId === order.id;
    const unitPriced = isUnitPricedOrder(order);
    const hasPendingAdjustment = Boolean(order.pending_adjustment);
    const iMarkedComplete = isProvider ? !!order.provider_completed_at : !!order.client_completed_at;
    const otherMarkedComplete = isProvider ? !!order.client_completed_at : !!order.provider_completed_at;
    const iRaisedDispute = order.disputed_by === user?.id;
    const otherProposedSplit = order.proposed_split_by !== null && order.proposed_split_by !== user?.id;
    const iProposedSplit = order.proposed_split_by !== null && order.proposed_split_by === user?.id;

    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Back link */}
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-700 transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            All Orders
          </button>

          {/* Order card — reuses the same layout as the list */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={order.status} />
                      <span className="font-mono text-xs text-charcoal-400">
                        {type === 'buyer' ? 'Purchasing' : 'Selling'}
                      </span>
                    </div>
                    <h3 className="font-sans font-bold text-xl text-charcoal-900 mb-1">
                      {order.service_title}
                    </h3>
                    <Link
                      to={`/${order.other_party.username}`}
                      className="flex items-center gap-2 mb-3 group w-fit"
                    >
                      <Avatar name={otherPartyName} size="sm" frame={order.other_party.cosmetics?.frame ?? null} src={order.other_party.profile_image} />
                      <span className="text-sm text-charcoal-600 group-hover:text-honey-600 transition-colors">
                        {type === 'buyer' ? `Provider: ${otherPartyName}` : `Client: ${otherPartyName}`}
                      </span>
                    </Link>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl text-charcoal-900 mb-1">
                      {'\u2B21'} {formatMoneyAmount(order.price)}
                    </div>
                    <div className="text-xs text-charcoal-500 mb-1">
                      {order.status === 'completed' ? 'Provider payout' : 'Service subtotal'}
                    </div>
                    <div className="text-xs text-charcoal-500">
                      Order #{String(order.id).toUpperCase()}
                    </div>
                  </div>
                </div>

                {(() => {
                  const sched = formatSchedule(order.scheduled_utc, order.scheduled_date, order.scheduled_time);
                  return sched ? (
                    <div className="flex items-center gap-6 text-sm text-charcoal-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4" />
                        <span>{sched.full}</span>
                      </div>
                    </div>
                  ) : null;
                })()}

                <OrderScopeSummary order={order} />

                <PendingAdjustmentPanel
                  order={order}
                  isProvider={isProvider}
                  otherPartyName={otherPartyName}
                  disabled={isUpdating}
                  onAccept={() => handleRespondToAdjustment(order, 'accept')}
                  onDecline={() => handleRespondToAdjustment(order, 'decline')}
                />

                {order.status === 'awaiting_completion' && (
                  <AwaitingCompletionNotice
                    order={order}
                    otherPartyName={otherPartyName}
                    iMarkedComplete={iMarkedComplete}
                  />
                )}

                {order.status === 'disputed' && (
                  <div className="bg-honey-50 border border-honey-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="size-5 text-honey-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-honey-800 font-medium mb-1">This order is under dispute</p>
                        {order.dispute_reason && (
                          <p className="text-sm text-honey-700 mb-2">Reason: {order.dispute_reason}</p>
                        )}
                        {order.dispute_resolution_deadline && (
                          <p className="text-xs text-honey-600 flex items-center gap-1">
                            <Clock className="size-3" />
                            Auto-resolves (50/50 split) in {timeUntil(order.dispute_resolution_deadline)}
                          </p>
                        )}
                        {order.proposed_split_provider_pct !== null && (
                          <div className="mt-3 bg-white/60 rounded-lg p-3 border border-honey-200">
                            <p className="text-sm text-honey-800">
                                <span className="font-medium">{iProposedSplit ? 'You proposed' : `${otherPartyName} proposed`}</span>
                                {' '}a split: {order.proposed_split_provider_pct}% to provider, {100 - order.proposed_split_provider_pct}% refunded to client
                              </p>
                              {otherProposedSplit && (
                                <button
                                onClick={() => handleAcceptSplit(order.id)}
                                disabled={isUpdating}
                                className="mt-2 h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                              >
                                {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                <CheckCircle2 className="size-4" />
                                Accept Split
                              </button>
                            )}
                            {iProposedSplit && (
                              <p className="text-xs text-honey-600 mt-2">Waiting for {otherPartyName} to accept or counter...</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/messages?userId=${order.other_party.id}&ctxType=order&ctxId=${order.id}&ctxTitle=${encodeURIComponent(order.service_title)}`)}
                    className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 flex items-center gap-2"
                  >
                    <MessageCircle className="size-4" />
                    Message
                  </button>

                  {renderTipUi(order, type, otherPartyName, isUpdating)}

                  {unitPriced && isProvider && ['pending', 'in_progress'].includes(order.status) && !hasPendingAdjustment && (
                    <>
                      {adjustmentOrderId === order.id ? (
                        <ScopeChangeComposer
                          order={order}
                          units={adjustmentUnits}
                          note={adjustmentNote}
                          disabled={isUpdating}
                          onUnitsChange={setAdjustmentUnits}
                          onNoteChange={setAdjustmentNote}
                          onSubmit={() => handleRequestAdjustment(order)}
                          onCancel={closeAdjustmentComposer}
                        />
                      ) : (
                        <button
                          onClick={() => openAdjustmentComposer(order)}
                          className="h-9 px-4 bg-blue-100 text-blue-800 rounded-md font-sans font-bold text-sm transition-all hover:bg-blue-200"
                        >
                          Request More Budget
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'completed' && type === 'buyer' && !order.has_review && !reviewedOrderIds.has(order.id) && (
                    <>
                      {reviewOrderId === order.id ? (
                        <div className="w-full mt-3 bg-honey-50 border border-honey-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-charcoal-800 mb-3">How was your experience with {otherPartyName}?</p>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                onMouseEnter={() => setReviewHover(star)}
                                onMouseLeave={() => setReviewHover(0)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star className={`size-7 ${star <= (reviewHover || reviewRating) ? 'text-honey-500 fill-honey-500' : 'text-charcoal-300'}`} />
                              </button>
                            ))}
                            {reviewRating > 0 && (
                              <span className="text-sm text-charcoal-600 ml-2 self-center">
                                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
                              </span>
                            )}
                          </div>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share details about your experience (optional)"
                            rows={3}
                            maxLength={1000}
                            className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-400 resize-none mb-3"
                          />
                          <CharacterLimitHint current={reviewComment.length} max={1000} className="-mt-2 mb-3" />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitReview(order.id)}
                              disabled={isUpdating || reviewRating < 1}
                              className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              {isUpdating && <Loader2 className="size-4 animate-spin" />}
                              <Star className="size-4" />
                              Submit Review
                            </button>
                            <button
                              onClick={() => { setReviewOrderId(null); setReviewRating(0); setReviewComment(''); setReviewHover(0); }}
                              className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            closeTipComposer();
                            setReviewOrderId(order.id);
                            setReviewRating(0);
                            setReviewComment('');
                            setReviewHover(0);
                          }}
                          className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center gap-2"
                        >
                          <Star className="size-4" />
                          Leave Review
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'completed' && type === 'seller' && !order.has_client_review && !clientReviewedOrderIds.has(order.id) && (
                    <>
                      {clientReviewOrderId === order.id ? (
                        <div className="w-full mt-3 bg-honey-50 border border-honey-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-charcoal-800 mb-3">How was {otherPartyName} as a client?</p>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setClientReviewRating(star)}
                                onMouseEnter={() => setClientReviewHover(star)}
                                onMouseLeave={() => setClientReviewHover(0)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star className={`size-7 ${star <= (clientReviewHover || clientReviewRating) ? 'text-honey-500 fill-honey-500' : 'text-charcoal-300'}`} />
                              </button>
                            ))}
                            {clientReviewRating > 0 && (
                              <span className="text-sm text-charcoal-600 ml-2 self-center">
                                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][clientReviewRating]}
                              </span>
                            )}
                          </div>
                          <textarea
                            value={clientReviewComment}
                            onChange={(e) => setClientReviewComment(e.target.value)}
                            placeholder="How was working with this client? (optional)"
                            rows={3}
                            maxLength={1000}
                            className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-400 resize-none mb-3"
                          />
                          <CharacterLimitHint current={clientReviewComment.length} max={1000} className="-mt-2 mb-3" />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitClientReview(order.id)}
                              disabled={isUpdating || clientReviewRating < 1}
                              className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              {isUpdating && <Loader2 className="size-4 animate-spin" />}
                              <Star className="size-4" />
                              Submit Review
                            </button>
                            <button
                              onClick={() => { setClientReviewOrderId(null); setClientReviewRating(0); setClientReviewComment(''); setClientReviewHover(0); }}
                              className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setClientReviewOrderId(order.id); setClientReviewRating(0); setClientReviewComment(''); setClientReviewHover(0); }}
                          className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center gap-2"
                        >
                          <Star className="size-4" />
                          Rate Client
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'in_progress' && !unitPriced && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      disabled={isUpdating}
                      className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 className="size-4 animate-spin" />}
                      <CheckCircle2 className="size-4" />
                      Mark Complete
                    </button>
                  )}

                  {order.status === 'in_progress' && unitPriced && isProvider && !hasPendingAdjustment && (
                    <>
                      {completionOrderId === order.id ? (
                        <CompletionQuantityComposer
                          order={order}
                          units={completionUnits}
                          disabled={isUpdating}
                          onUnitsChange={setCompletionUnits}
                          onSubmit={() => handleSubmitCompletion(order)}
                          onCancel={closeCompletionComposer}
                        />
                      ) : (
                        <button
                          onClick={() => openCompletionComposer(order)}
                          disabled={isUpdating}
                          className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUpdating && <Loader2 className="size-4 animate-spin" />}
                          <CheckCircle2 className="size-4" />
                          Submit Final Quantity
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'awaiting_completion' && !iMarkedComplete && otherMarkedComplete && !unitPriced && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      disabled={isUpdating}
                      className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 className="size-4 animate-spin" />}
                      <CheckCircle2 className="size-4" />
                      Confirm Completion
                    </button>
                  )}

                  {order.status === 'awaiting_completion' && !iMarkedComplete && otherMarkedComplete && unitPriced && !isProvider && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      disabled={isUpdating}
                      className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 className="size-4 animate-spin" />}
                      <CheckCircle2 className="size-4" />
                      Confirm Settlement
                    </button>
                  )}

                  {order.status === 'awaiting_completion' && !iMarkedComplete && otherMarkedComplete && unitPriced && isProvider && !hasPendingAdjustment && (
                    <>
                      {completionOrderId === order.id ? (
                        <CompletionQuantityComposer
                          order={order}
                          units={completionUnits}
                          disabled={isUpdating}
                          onUnitsChange={setCompletionUnits}
                          onSubmit={() => handleSubmitCompletion(order)}
                          onCancel={closeCompletionComposer}
                        />
                      ) : (
                        <button
                          onClick={() => openCompletionComposer(order)}
                          disabled={isUpdating}
                          className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUpdating && <Loader2 className="size-4 animate-spin" />}
                          <CheckCircle2 className="size-4" />
                          Submit Final Quantity
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'awaiting_completion' && !iMarkedComplete && (
                    <>
                      {disputeOrderId === order.id ? (
                        <div className="w-full mt-3 bg-honey-50 border border-honey-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-honey-800 mb-2">Why are you disputing this order?</p>
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Describe the issue..."
                            rows={3}
                            maxLength={1000}
                            className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 resize-none mb-3"
                          />
                          <CharacterLimitHint current={disputeReason.length} max={1000} className="-mt-2 mb-3" />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRaiseDispute(order.id)}
                              disabled={isUpdating || !disputeReason.trim()}
                              className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              {isUpdating && <Loader2 className="size-4 animate-spin" />}
                              <ShieldAlert className="size-4" />
                              Submit Dispute
                            </button>
                            <button
                              onClick={() => { setDisputeOrderId(null); setDisputeReason(''); }}
                              className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDisputeOrderId(order.id)}
                          className="h-9 px-4 bg-honey-100 text-honey-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-50 flex items-center gap-2"
                        >
                          <ShieldAlert className="size-4" />
                          Dispute
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'disputed' && (
                    <>
                      {splitOrderId === order.id ? (
                        <div className="w-full mt-3 bg-charcoal-50 border border-charcoal-200 rounded-lg p-4">
                          <p className="text-sm font-medium text-charcoal-800 mb-3">Propose a payment split</p>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-charcoal-600 mb-1">
                              <span>Provider: {splitPct}%</span>
                              <span>Client refund: {100 - splitPct}%</span>
                            </div>
                            <input type="range" min={0} max={100} step={5} value={splitPct} onChange={(e) => setSplitPct(Number(e.target.value))} className="w-full accent-honey-500" />
                            <div className="flex justify-between text-xs text-charcoal-500 mt-1">
                              <span>{'\u2B21'} {formatMoneyAmount(providerAmountForSplit(order, splitPct))} to provider</span>
                              <span>{'\u2B21'} {formatMoneyAmount(refundAmountForSplit(order, splitPct))} refund</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProposeSplit(order.id)}
                              disabled={isUpdating}
                              className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              {isUpdating && <Loader2 className="size-4 animate-spin" />}
                              <ArrowRight className="size-4" />
                              Send Proposal
                            </button>
                            <button onClick={() => setSplitOrderId(null)} className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSplitOrderId(order.id); setSplitPct(50); }}
                          className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center gap-2"
                        >
                          Propose Split
                        </button>
                      )}

                      {iRaisedDispute && (
                        <button
                          onClick={() => handleWithdrawDispute(order.id)}
                          disabled={isUpdating}
                          className="h-9 px-4 bg-emerald-100 text-emerald-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUpdating && <Loader2 className="size-4 animate-spin" />}
                          <CheckCircle2 className="size-4" />
                          Accept Completion
                        </button>
                      )}
                    </>
                  )}

                  {order.status === 'pending' && isProvider && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                      disabled={isUpdating}
                      className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 className="size-4 animate-spin" />}
                      Start
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                      disabled={isUpdating}
                      className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline */}
              {activeStatuses.includes(order.status) && (
                <div className="lg:w-64 border-l border-charcoal-100 pl-6">
                  <h4 className="font-sans font-bold text-sm text-charcoal-900 mb-3">Order Status</h4>
                  <div className="space-y-3">
                    <TimelineStep label="Booked" sublabel="Order confirmed" active={true} showLine={true} />
                    <TimelineStep label="In Progress" sublabel="Service active" active={['in_progress', 'awaiting_completion', 'completed', 'disputed'].includes(order.status)} showLine={true} />
                    <TimelineStep label="Awaiting Confirmation" sublabel={order.status === 'awaiting_completion' ? 'Confirming completion' : 'Both confirm'} active={['awaiting_completion', 'completed'].includes(order.status)} showLine={true} warning={order.status === 'disputed'} />
                    {order.status === 'disputed' && <TimelineStep label="Disputed" sublabel="Under negotiation" active={true} showLine={false} variant="warning" />}
                    {order.status !== 'disputed' && <TimelineStep label="Completed" sublabel="Service done" active={order.status === 'completed'} showLine={false} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-2">
            My Orders
          </h1>
          <p className="text-charcoal-600">
            Track your active bookings and view order history
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-charcoal-100">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-2 font-sans font-bold text-sm transition-colors relative ${
              activeTab === 'active' ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            Active ({activeOrdersList.length})
            {activeTab === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-honey-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-2 font-sans font-bold text-sm transition-colors relative ${
              activeTab === 'completed' ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            Completed ({completedOrdersList.length})
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-honey-500" />
            )}
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <FileText className="size-12 text-charcoal-300 mx-auto mb-3" />
            <h3 className="font-display italic text-xl text-charcoal-900 mb-2">
              No {activeTab} orders
            </h3>
            <p className="text-charcoal-600 mb-6">
              {activeTab === 'active'
                ? "You don't have any active orders at the moment."
                : "You haven't completed any orders yet."}
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const type = order.client_id === user?.id ? 'buyer' : 'seller';
              const isProvider = user?.id === order.provider_id;
              const otherPartyName = `${order.other_party.first_name} ${order.other_party.last_name}`;
              const isUpdating = updatingId === order.id;
              const unitPriced = isUnitPricedOrder(order);
              const hasPendingAdjustment = Boolean(order.pending_adjustment);

              // Two-sided completion state
              const iMarkedComplete = isProvider
                ? !!order.provider_completed_at
                : !!order.client_completed_at;
              const otherMarkedComplete = isProvider
                ? !!order.client_completed_at
                : !!order.provider_completed_at;

              // Dispute state
              const iRaisedDispute = order.disputed_by === user?.id;
              const otherProposedSplit =
                order.proposed_split_by !== null && order.proposed_split_by !== user?.id;
              const iProposedSplit =
                order.proposed_split_by !== null && order.proposed_split_by === user?.id;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-charcoal-100 rounded-xl p-6 hover:border-charcoal-200 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={order.status} />
                            <span className="font-mono text-xs text-charcoal-400">
                              {type === 'buyer' ? 'Purchasing' : 'Selling'}
                            </span>
                          </div>
                          <h3 className="font-sans font-bold text-xl text-charcoal-900 mb-1">
                            {order.service_title}
                          </h3>
                          <Link
                            to={`/${order.other_party.username}`}
                            className="flex items-center gap-2 mb-3 group w-fit"
                          >
                            <Avatar
                              name={otherPartyName}
                              size="sm"
                              frame={order.other_party.cosmetics?.frame ?? null}
                              src={order.other_party.profile_image}
                            />
                            <span className="text-sm text-charcoal-600 group-hover:text-honey-600 transition-colors">
                              {type === 'buyer' ? `Provider: ${otherPartyName}` : `Client: ${otherPartyName}`}
                            </span>
                          </Link>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-2xl text-charcoal-900 mb-1">
                            {'\u2B21'} {formatMoneyAmount(order.price)}
                          </div>
                          <div className="text-xs text-charcoal-500 mb-1">
                            {order.status === 'completed' ? 'Provider payout' : 'Service subtotal'}
                          </div>
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="text-xs text-honey-600 hover:text-honey-700 font-medium transition-colors"
                          >
                            Order #{String(order.id).toUpperCase()} &rarr;
                          </button>
                        </div>
                      </div>

                      {/* Schedule */}
                      {(() => {
                        const sched = formatSchedule(order.scheduled_utc, order.scheduled_date, order.scheduled_time);
                        return sched ? (
                          <div className="flex items-center gap-6 text-sm text-charcoal-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="size-4" />
                              <span>{sched.full}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      <OrderScopeSummary order={order} />

                      <PendingAdjustmentPanel
                        order={order}
                        isProvider={isProvider}
                        otherPartyName={otherPartyName}
                        disabled={isUpdating}
                        onAccept={() => handleRespondToAdjustment(order, 'accept')}
                        onDecline={() => handleRespondToAdjustment(order, 'decline')}
                      />

                      {/* Awaiting Completion Info */}
                      {order.status === 'awaiting_completion' && (
                        <AwaitingCompletionNotice
                          order={order}
                          otherPartyName={otherPartyName}
                          iMarkedComplete={iMarkedComplete}
                        />
                      )}

                      {/* Disputed Info */}
                      {order.status === 'disputed' && (
                        <div className="bg-honey-50 border border-honey-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <ShieldAlert className="size-5 text-honey-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-honey-800 font-medium mb-1">
                                This order is under dispute
                              </p>
                              {order.dispute_reason && (
                                <p className="text-sm text-honey-700 mb-2">
                                  Reason: {order.dispute_reason}
                                </p>
                              )}
                              {order.dispute_resolution_deadline && (
                                <p className="text-xs text-honey-600 flex items-center gap-1">
                                  <Clock className="size-3" />
                                  Auto-resolves (50/50 split) in {timeUntil(order.dispute_resolution_deadline)}
                                </p>
                              )}

                              {/* Proposed split info */}
                              {order.proposed_split_provider_pct !== null && (
                                <div className="mt-3 bg-white/60 rounded-lg p-3 border border-honey-200">
                                  <p className="text-sm text-honey-800">
                                    <span className="font-medium">
                                      {iProposedSplit ? 'You proposed' : `${otherPartyName} proposed`}
                                    </span>
                                    {' '}a split: {order.proposed_split_provider_pct}% to provider, {100 - order.proposed_split_provider_pct}% refunded to client
                                  </p>
                                  {otherProposedSplit && (
                                    <button
                                      onClick={() => handleAcceptSplit(order.id)}
                                      disabled={isUpdating}
                                      className="mt-2 h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                                    >
                                      {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                      <CheckCircle2 className="size-4" />
                                      Accept Split
                                    </button>
                                  )}
                                  {iProposedSplit && (
                                    <p className="text-xs text-honey-600 mt-2">
                                      Waiting for {otherPartyName} to accept or counter...
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/messages?userId=${order.other_party.id}&ctxType=order&ctxId=${order.id}&ctxTitle=${encodeURIComponent(order.service_title)}`)}
                          className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 flex items-center gap-2"
                        >
                          <MessageCircle className="size-4" />
                          Message
                        </button>

                        {renderTipUi(order, type, otherPartyName, isUpdating)}

                        {unitPriced && isProvider && ['pending', 'in_progress'].includes(order.status) && !hasPendingAdjustment && (
                          <>
                            {adjustmentOrderId === order.id ? (
                              <ScopeChangeComposer
                                order={order}
                                units={adjustmentUnits}
                                note={adjustmentNote}
                                disabled={isUpdating}
                                onUnitsChange={setAdjustmentUnits}
                                onNoteChange={setAdjustmentNote}
                                onSubmit={() => handleRequestAdjustment(order)}
                                onCancel={closeAdjustmentComposer}
                              />
                            ) : (
                              <button
                                onClick={() => openAdjustmentComposer(order)}
                                className="h-9 px-4 bg-blue-100 text-blue-800 rounded-md font-sans font-bold text-sm transition-all hover:bg-blue-200"
                              >
                                Request More Budget
                              </button>
                            )}
                          </>
                        )}

                        {order.status === 'completed' && type === 'buyer' && !order.has_review && !reviewedOrderIds.has(order.id) && (
                          <>
                            {reviewOrderId === order.id ? (
                              <div className="w-full mt-3 bg-honey-50 border border-honey-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-charcoal-800 mb-3">
                                  How was your experience with {otherPartyName}?
                                </p>
                                {/* Star rating */}
                                <div className="flex gap-1 mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setReviewRating(star)}
                                      onMouseEnter={() => setReviewHover(star)}
                                      onMouseLeave={() => setReviewHover(0)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={`size-7 ${
                                          star <= (reviewHover || reviewRating)
                                            ? 'text-honey-500 fill-honey-500'
                                            : 'text-charcoal-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  {reviewRating > 0 && (
                                    <span className="text-sm text-charcoal-600 ml-2 self-center">
                                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
                                    </span>
                                  )}
                                </div>
                                {/* Comment */}
                                <textarea
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  placeholder="Share details about your experience (optional)"
                                  rows={3}
                                  maxLength={1000}
                                  className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-400 resize-none mb-3"
                                />
                                <CharacterLimitHint current={reviewComment.length} max={1000} className="-mt-2 mb-3" />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSubmitReview(order.id)}
                                    disabled={isUpdating || reviewRating < 1}
                                    className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                    <Star className="size-4" />
                                    Submit Review
                                  </button>
                                  <button
                                    onClick={() => { setReviewOrderId(null); setReviewRating(0); setReviewComment(''); setReviewHover(0); }}
                                    className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  closeTipComposer();
                                  setReviewOrderId(order.id);
                                  setReviewRating(0);
                                  setReviewComment('');
                                  setReviewHover(0);
                                }}
                                className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center gap-2"
                              >
                                <Star className="size-4" />
                                Leave Review
                              </button>
                            )}
                          </>
                        )}

                        {order.status === 'completed' && type === 'seller' && !order.has_client_review && !clientReviewedOrderIds.has(order.id) && (
                          <>
                            {clientReviewOrderId === order.id ? (
                              <div className="w-full mt-3 bg-honey-50 border border-honey-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-charcoal-800 mb-3">
                                  How was {otherPartyName} as a client?
                                </p>
                                <div className="flex gap-1 mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setClientReviewRating(star)}
                                      onMouseEnter={() => setClientReviewHover(star)}
                                      onMouseLeave={() => setClientReviewHover(0)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={`size-7 ${
                                          star <= (clientReviewHover || clientReviewRating)
                                            ? 'text-honey-500 fill-honey-500'
                                            : 'text-charcoal-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  {clientReviewRating > 0 && (
                                    <span className="text-sm text-charcoal-600 ml-2 self-center">
                                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][clientReviewRating]}
                                    </span>
                                  )}
                                </div>
                                <textarea
                                  value={clientReviewComment}
                                  onChange={(e) => setClientReviewComment(e.target.value)}
                                  placeholder="How was working with this client? (optional)"
                                  rows={3}
                                  maxLength={1000}
                                  className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-400 resize-none mb-3"
                                />
                                <CharacterLimitHint current={clientReviewComment.length} max={1000} className="-mt-2 mb-3" />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSubmitClientReview(order.id)}
                                    disabled={isUpdating || clientReviewRating < 1}
                                    className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                    <Star className="size-4" />
                                    Submit Review
                                  </button>
                                  <button
                                    onClick={() => { setClientReviewOrderId(null); setClientReviewRating(0); setClientReviewComment(''); setClientReviewHover(0); }}
                                    className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setClientReviewOrderId(order.id); setClientReviewRating(0); setClientReviewComment(''); setClientReviewHover(0); }}
                                className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center gap-2"
                              >
                                <Star className="size-4" />
                                Rate Client
                              </button>
                            )}
                          </>
                        )}

                        {/* Mark Complete — available for in_progress orders (both sides) */}
                  {order.status === 'in_progress' && !unitPriced && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      disabled={isUpdating}
                      className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 className="size-4 animate-spin" />}
                      <CheckCircle2 className="size-4" />
                      Mark Complete
                    </button>
                  )}

                  {order.status === 'in_progress' && unitPriced && isProvider && !hasPendingAdjustment && (
                    <>
                      {completionOrderId === order.id ? (
                        <CompletionQuantityComposer
                          order={order}
                          units={completionUnits}
                          disabled={isUpdating}
                          onUnitsChange={setCompletionUnits}
                          onSubmit={() => handleSubmitCompletion(order)}
                          onCancel={closeCompletionComposer}
                        />
                      ) : (
                        <button
                          onClick={() => openCompletionComposer(order)}
                          disabled={isUpdating}
                          className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUpdating && <Loader2 className="size-4 animate-spin" />}
                          <CheckCircle2 className="size-4" />
                          Submit Final Quantity
                        </button>
                      )}
                    </>
                  )}

                        {/* Awaiting completion — confirm (if other marked first) */}
                        {order.status === 'awaiting_completion' && !iMarkedComplete && otherMarkedComplete && !unitPriced && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            disabled={isUpdating}
                            className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isUpdating && <Loader2 className="size-4 animate-spin" />}
                            <CheckCircle2 className="size-4" />
                            Confirm Completion
                          </button>
                        )}

                        {order.status === 'awaiting_completion' && !iMarkedComplete && otherMarkedComplete && unitPriced && !isProvider && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            disabled={isUpdating}
                            className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isUpdating && <Loader2 className="size-4 animate-spin" />}
                            <CheckCircle2 className="size-4" />
                            Confirm Settlement
                          </button>
                        )}

                        {order.status === 'awaiting_completion' && !iMarkedComplete && otherMarkedComplete && unitPriced && isProvider && !hasPendingAdjustment && (
                          <>
                            {completionOrderId === order.id ? (
                              <CompletionQuantityComposer
                                order={order}
                                units={completionUnits}
                                disabled={isUpdating}
                                onUnitsChange={setCompletionUnits}
                                onSubmit={() => handleSubmitCompletion(order)}
                                onCancel={closeCompletionComposer}
                              />
                            ) : (
                              <button
                                onClick={() => openCompletionComposer(order)}
                                disabled={isUpdating}
                                className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                              >
                                {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                <CheckCircle2 className="size-4" />
                                Submit Final Quantity
                              </button>
                            )}
                          </>
                        )}

                        {/* Awaiting completion — dispute button (if other marked first) */}
                        {order.status === 'awaiting_completion' && !iMarkedComplete && (
                          <>
                            {disputeOrderId === order.id ? (
                              <div className="w-full mt-3 bg-honey-50 border border-honey-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-honey-800 mb-2">
                                  Why are you disputing this order?
                                </p>
                                <textarea
                                  value={disputeReason}
                                  onChange={(e) => setDisputeReason(e.target.value)}
                                  placeholder="Describe the issue..."
                                  rows={3}
                                  maxLength={1000}
                                  className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 resize-none mb-3"
                                />
                                <CharacterLimitHint current={disputeReason.length} max={1000} className="-mt-2 mb-3" />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRaiseDispute(order.id)}
                                    disabled={isUpdating || !disputeReason.trim()}
                                    className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                    <ShieldAlert className="size-4" />
                                    Submit Dispute
                                  </button>
                                  <button
                                    onClick={() => { setDisputeOrderId(null); setDisputeReason(''); }}
                                    className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDisputeOrderId(order.id)}
                                className="h-9 px-4 bg-honey-100 text-honey-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-50 flex items-center gap-2"
                              >
                                <ShieldAlert className="size-4" />
                                Dispute
                              </button>
                            )}
                          </>
                        )}

                        {/* Disputed — propose split */}
                        {order.status === 'disputed' && (
                          <>
                            {splitOrderId === order.id ? (
                              <div className="w-full mt-3 bg-charcoal-50 border border-charcoal-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-charcoal-800 mb-3">
                                  Propose a payment split
                                </p>
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs text-charcoal-600 mb-1">
                                    <span>Provider: {splitPct}%</span>
                                    <span>Client refund: {100 - splitPct}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={splitPct}
                                    onChange={(e) => setSplitPct(Number(e.target.value))}
                                    className="w-full accent-honey-500"
                                  />
                                  <div className="flex justify-between text-xs text-charcoal-500 mt-1">
                                    <span>{'\u2B21'} {formatMoneyAmount(providerAmountForSplit(order, splitPct))} to provider</span>
                                    <span>{'\u2B21'} {formatMoneyAmount(refundAmountForSplit(order, splitPct))} refund</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleProposeSplit(order.id)}
                                    disabled={isUpdating}
                                    className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                    <ArrowRight className="size-4" />
                                    Send Proposal
                                  </button>
                                  <button
                                    onClick={() => setSplitOrderId(null)}
                                    className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setSplitOrderId(order.id); setSplitPct(50); }}
                                className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 flex items-center gap-2"
                              >
                                Propose Split
                              </button>
                            )}

                            {/* Withdraw dispute (only disputer can) */}
                            {iRaisedDispute && (
                              <button
                                onClick={() => handleWithdrawDispute(order.id)}
                                disabled={isUpdating}
                                className="h-9 px-4 bg-emerald-100 text-emerald-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-2"
                              >
                                {isUpdating && <Loader2 className="size-4 animate-spin" />}
                                <CheckCircle2 className="size-4" />
                                Accept Completion
                              </button>
                            )}
                          </>
                        )}

                        {/* Pending — start / cancel */}
                        {order.status === 'pending' && isProvider && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                            disabled={isUpdating}
                            className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isUpdating && <Loader2 className="size-4 animate-spin" />}
                            Start
                          </button>
                        )}

                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            disabled={isUpdating}
                            className="h-9 px-4 bg-charcoal-100 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timeline (for active orders) */}
                    {activeTab === 'active' && (
                      <div className="lg:w-64 border-l border-charcoal-100 pl-6">
                        <h4 className="font-sans font-bold text-sm text-charcoal-900 mb-3">
                          Order Status
                        </h4>
                        <div className="space-y-3">
                          {/* Step 1: Booked */}
                          <TimelineStep
                            label="Booked"
                            sublabel="Order confirmed"
                            active={true}
                            showLine={true}
                          />

                          {/* Step 2: In Progress */}
                          <TimelineStep
                            label="In Progress"
                            sublabel="Service active"
                            active={['in_progress', 'awaiting_completion', 'completed', 'disputed'].includes(order.status)}
                            showLine={true}
                          />

                          {/* Step 3: Awaiting Confirmation */}
                          <TimelineStep
                            label="Awaiting Confirmation"
                            sublabel={order.status === 'awaiting_completion' ? 'Confirming completion' : 'Both confirm'}
                            active={['awaiting_completion', 'completed'].includes(order.status)}
                            showLine={true}
                            warning={order.status === 'disputed'}
                          />

                          {/* Step 3b: Disputed (branch) */}
                          {order.status === 'disputed' && (
                            <TimelineStep
                              label="Disputed"
                              sublabel="Under negotiation"
                              active={true}
                              showLine={false}
                              variant="warning"
                            />
                          )}

                          {/* Step 4: Completed */}
                          {order.status !== 'disputed' && (
                            <TimelineStep
                              label="Completed"
                              sublabel="Service done"
                              active={order.status === 'completed'}
                              showLine={false}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TipSummary({
  amount,
  tippedAt,
  type,
  otherPartyName,
}: {
  amount: number;
  tippedAt: string | null;
  type: OrderViewType;
  otherPartyName: string;
}) {
  const tippedLabel = tippedAt
    ? parseUTC(tippedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="w-full mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-900">
            {type === 'buyer'
              ? `Tip sent. ⬡ ${formatMoneyAmount(amount)} went directly to ${otherPartyName}.`
              : `Tip received. ${otherPartyName} sent you ⬡ ${formatMoneyAmount(amount)}.`}
          </p>
          {tippedLabel && (
            <p className="text-xs text-emerald-700 mt-1">
              {type === 'buyer' ? 'Sent' : 'Received'} {tippedLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TipComposer({
  amount,
  disabled,
  draftValid,
  onAmountChange,
  onCancel,
  onPresetSelect,
  onSubmit,
  otherPartyName,
  presetMatches,
  tipCap,
}: {
  amount: string;
  disabled: boolean;
  draftValid: boolean;
  onAmountChange: (value: string) => void;
  onCancel: () => void;
  onPresetSelect: (pct: number) => void;
  onSubmit: () => void;
  otherPartyName: string;
  presetMatches: (pct: number) => boolean;
  tipCap: number;
}) {
  const parsedAmount = parseMoneyAmount(amount);

  return (
    <div className="w-full mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <p className="text-sm font-medium text-charcoal-800 mb-1">
        Add an extra thank-you for {otherPartyName}
      </p>
      <p className="text-xs text-charcoal-600 mb-4">
        Any extra goes straight to the provider.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {TIP_PRESET_PCTS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => onPresetSelect(pct)}
            aria-pressed={presetMatches(pct)}
            className={`h-10 px-4 rounded-full border text-sm font-sans font-bold transition-all ${
              presetMatches(pct)
                ? 'bg-charcoal-900 border-charcoal-900 text-white shadow-[0_10px_24px_rgba(19,18,16,0.16)] ring-2 ring-white/80'
                : 'bg-white border-emerald-300 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-100'
            }`}
          >
            {pct}%
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium uppercase tracking-[0.16em] text-charcoal-500 mb-2">
          Custom Amount
        </label>
        <CurrencyInput
          value={amount}
          onChange={onAmountChange}
          showMaxHint={false}
          maxValue={tipCap}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-charcoal-700 mb-4">
        <span>Tip amount</span>
        <span className="font-mono text-base text-charcoal-900">⬡ {formatMoneyAmount(parsedAmount)}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={disabled || !draftValid}
          className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
        >
          {disabled && <Loader2 className="size-4 animate-spin" />}
          Send Tip
        </button>
        <button
          onClick={onCancel}
          className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function OrderScopeSummary({ order }: { order: Order }) {
  if (!isUnitPricedOrder(order)) return null;

  const basis = settlementBasis(order);
  const hasSubmittedSettlement = order.actual_units !== null && order.settlement_total !== null;
  const refundPreview = Math.max(0, order.total - basis.total);

  return (
    <div className="mb-4 rounded-xl border border-charcoal-100 bg-cream-50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal-500">
          Scope & Payment
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          label="Rate"
          value={`⬡ ${formatMoneyAmount(order.unit_rate)} / ${displayUnitName(order.unit_label_snapshot, 1)}`}
        />
        <SummaryStat
          label={order.status === 'completed' && order.actual_units !== null ? 'Delivered' : 'Approved Now'}
          value={formatUnitsLabel(order.status === 'completed' && order.actual_units !== null ? order.actual_units : order.authorized_units, order.unit_label_snapshot)}
        />
        <SummaryStat
          label={order.status === 'completed' ? 'Final Total' : 'Amount Set Aside'}
          value={`⬡ ${formatMoneyAmount(order.total)}`}
        />
      </div>

      {hasSubmittedSettlement && order.status !== 'completed' && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SummaryStat
            label="Final Quantity"
            value={formatUnitsLabel(order.actual_units ?? 0, order.unit_label_snapshot)}
          />
          <SummaryStat
            label="Final Amount"
            value={`⬡ ${formatMoneyAmount(basis.total)}`}
          />
          <SummaryStat
            label="Amount Coming Back"
            value={`⬡ ${formatMoneyAmount(refundPreview)}`}
          />
        </div>
      )}

      {order.refunded_amount > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ⬡ {formatMoneyAmount(order.refunded_amount)} was returned from unused or disputed funds.
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-charcoal-100 bg-white px-3 py-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-charcoal-900">{value}</div>
    </div>
  );
}

function PendingAdjustmentPanel({
  order,
  isProvider,
  otherPartyName,
  disabled,
  onAccept,
  onDecline,
}: {
  order: Order;
  isProvider: boolean;
  otherPartyName: string;
  disabled: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const adjustment = order.pending_adjustment;
  if (!adjustment) return null;

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            More budget requested for {formatUnitsLabel(adjustment.units_delta, order.unit_label_snapshot)}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Approving this adds ⬡ {formatMoneyAmount(adjustment.total_delta)} to the amount set aside for this order.
          </p>
          {adjustment.note && (
            <p className="mt-2 text-sm text-blue-700">
              Note: {adjustment.note}
            </p>
          )}
          {isProvider ? (
            <p className="mt-2 text-xs text-blue-700">
              Waiting for {otherPartyName} to accept or decline this scope change.
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
          Pending
        </span>
      </div>

      {!isProvider && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onAccept}
            disabled={disabled}
            className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            Approve & Add Budget
          </button>
          <button
            onClick={onDecline}
            disabled={disabled}
            className="h-9 px-4 bg-white border border-blue-200 text-blue-800 rounded-md font-sans font-bold text-sm transition-all hover:bg-blue-100 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

function AwaitingCompletionNotice({
  order,
  otherPartyName,
  iMarkedComplete,
}: {
  order: Order;
  otherPartyName: string;
  iMarkedComplete: boolean;
}) {
  const basis = settlementBasis(order);
  const refundPreview = Math.max(0, order.total - basis.total);
  const hasFinalQuantity = order.actual_units !== null && order.settlement_total !== null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Timer className="size-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          {iMarkedComplete ? (
            <p className="text-sm text-blue-800 font-medium">
              {hasFinalQuantity
                ? `You submitted ${formatUnitsLabel(order.actual_units ?? 0, order.unit_label_snapshot)}. Waiting for ${otherPartyName} to confirm.`
                : `You marked this order as complete. Waiting for ${otherPartyName} to confirm.`}
            </p>
          ) : (
            <p className="text-sm text-blue-800 font-medium">
              {hasFinalQuantity
                ? `${otherPartyName} submitted ${formatUnitsLabel(order.actual_units ?? 0, order.unit_label_snapshot)} for final review. Please confirm or dispute.`
                : `${otherPartyName} marked this order as complete. Please confirm or dispute.`}
            </p>
          )}
          {hasFinalQuantity && (
            <p className="text-xs text-blue-700 mt-1">
              Paid out ⬡ {formatMoneyAmount(basis.subtotal)}
              {refundPreview > 0 ? ` • ⬡ ${formatMoneyAmount(refundPreview)} is returned` : ''}
            </p>
          )}
          {order.auto_complete_at && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Clock className="size-3" />
              Auto-completes in {timeUntil(order.auto_complete_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScopeChangeComposer({
  order,
  units,
  note,
  disabled,
  onUnitsChange,
  onNoteChange,
  onSubmit,
  onCancel,
}: {
  order: Order;
  units: string;
  note: string;
  disabled: boolean;
  onUnitsChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const parsedUnits = parseUnitsAmount(units) ?? 0;
  const subtotal = parsedUnits > 0 ? parseMoneyAmount(String(parsedUnits * order.unit_rate)) : 0;
  const total = parseMoneyAmount(String(subtotal + subtotal * 0.10));

  return (
    <div className="mt-3 w-full rounded-xl border border-honey-200 bg-honey-50 p-4">
      <p className="text-sm font-semibold text-charcoal-900 mb-2">Request more budget</p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-charcoal-500 mb-2">
            Additional {displayUnitName(order.unit_label_snapshot, 2)}
          </label>
          <input
            type="number"
            min={unitStepForOrder(order)}
            step={unitStepForOrder(order)}
            value={units}
            onChange={(e) => onUnitsChange(e.target.value)}
            className="w-full h-11 px-3 bg-white border border-honey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-charcoal-500 mb-2">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Why is more scope needed?"
            className="w-full px-3 py-2 bg-white border border-honey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-400 resize-none"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-charcoal-700">
        <span>Added work amount: ⬡ {formatMoneyAmount(subtotal)}</span>
        <span>Extra amount set aside: ⬡ {formatMoneyAmount(total)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50"
        >
          Send Request
        </button>
        <button
          onClick={onCancel}
          className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CompletionQuantityComposer({
  order,
  units,
  disabled,
  onUnitsChange,
  onSubmit,
  onCancel,
}: {
  order: Order;
  units: string;
  disabled: boolean;
  onUnitsChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const parsedUnits = parseUnitsAmount(units) ?? 0;
  const subtotal = parsedUnits > 0 ? parseMoneyAmount(String(parsedUnits * order.unit_rate)) : 0;
  const fee = parseMoneyAmount(String(subtotal * 0.10));
  const total = parseMoneyAmount(String(subtotal + fee));
  const refund = parseMoneyAmount(String(Math.max(0, order.total - total)));

  return (
    <div className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-charcoal-900 mb-2">Submit final delivered quantity</p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-charcoal-500 mb-2">
            Delivered {displayUnitName(order.unit_label_snapshot, 2)}
          </label>
          <input
            type="number"
            min={minimumUnitsForOrder(order)}
            max={order.authorized_units}
            step={unitStepForOrder(order)}
            value={units}
            onChange={(e) => onUnitsChange(e.target.value)}
            className="w-full h-11 px-3 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3">
          <div className="flex justify-between text-sm text-charcoal-700">
            <span>Final amount to release</span>
            <span className="font-mono">⬡ {formatMoneyAmount(total)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-charcoal-700">
            <span>Amount returned</span>
            <span className="font-mono">⬡ {formatMoneyAmount(refund)}</span>
          </div>
          <p className="mt-3 text-xs text-charcoal-500">
            The buyer confirms this before the provider is paid.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="h-9 px-4 bg-emerald-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50"
        >
          Submit Final Quantity
        </button>
        <button
          onClick={onCancel}
          className="h-9 px-4 bg-white border border-charcoal-200 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  sublabel,
  active,
  showLine,
  variant = 'default',
  warning = false,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  showLine: boolean;
  variant?: 'default' | 'warning';
  warning?: boolean;
}) {
  const dotColor = warning
    ? 'bg-honey-400'
    : variant === 'warning'
      ? 'bg-honey-500'
      : active
        ? 'bg-green-500'
        : 'bg-charcoal-200';

  const lineColor = warning
    ? 'bg-honey-200'
    : active
      ? 'bg-green-200'
      : 'bg-charcoal-100';

  return (
    <div className="flex gap-3">
      <div className="relative">
        <div className={`size-6 ${dotColor} rounded-full flex items-center justify-center`}>
          <div className="size-2 bg-white rounded-full" />
        </div>
        {showLine && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-8 ${lineColor}`} />
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-charcoal-900">{label}</div>
        <div className="text-xs text-charcoal-500">{sublabel}</div>
      </div>
    </div>
  );
}
