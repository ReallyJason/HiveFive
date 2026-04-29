import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { ProposalModal } from '../components/ProposalModal';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner@2.0.3';
import { Calendar, DollarSign, Clock, User, CheckCircle2, ArrowLeft, Loader2, MessageCircle, Trash2, Pencil, Save, X, Check, XCircle, Link2, ArrowRight, Star } from 'lucide-react';
import { CurrencyInput } from '../components/CurrencyInput';
import { CustomSelect } from '../components/CustomSelect';
import { DatePicker } from '../components/DatePicker';
import { TimePicker } from '../components/TimePicker';
import { CATEGORIES, BUDGET_RANGES, parseLocalDate, parseUTC } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { sanitizeContent } from '../lib/contentFilter';

interface Proposal {
  id: number;
  provider_id: number;
  provider_username: string;
  provider_first_name: string;
  provider_last_name: string;
  provider_profile_image?: string | null;
  price: number;
  message: string;
  estimated_delivery: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  created_at: string;
}

interface CosmeticsPayload {
  frame: { gradient: string; glow: string; css_animation: string | null; ring_size: number } | null;
  badge: { tag: string; bg_color: string; text_color: string; bg_gradient: string | null; css_animation: string | null } | null;
}

interface RequestData {
  id: number;
  requester_id: number;
  title: string;
  description: string;
  category: string;
  budget: string;
  budget_range: string;
  deadline: string | null;
  status: string;
  requester_first_name: string;
  requester_last_name: string;
  requester_username: string;
  requester_profile_image?: string | null;
  cosmetics?: CosmeticsPayload;
  created_at: string;
  proposals: Proposal[];
  proposal_count: number;
}

interface RequestResponse {
  request: RequestData;
  proposal_count: number;
}

function formatDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Ongoing';
  return formatDate(deadline);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - parseUTC(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editing own proposal
  const [editingProposal, setEditingProposal] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Matching providers (owner only)
  const [matchingProviders, setMatchingProviders] = useState<{
    total: number;
    services: { id: number; title: string; price: number; price_unit: string; rating: number; review_count: number; provider_username: string; first_name: string; last_name: string; profile_image?: string | null }[];
  }>({ total: 0, services: [] });

  // Editing request (owner only)
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
    budget_range: '',
    deadline: '',
  });
  const [savingRequest, setSavingRequest] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchRequest() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const data = await apiGet<RequestResponse>('/requests/get.php', { id });
        if (cancelled) return;
        setRequest(data.request);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load request');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRequest();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!request?.category || !user || user.id !== request.requester_id) return;
    apiGet<{ services: { id: number; title: string; price: number; price_unit: string; rating: number; review_count: number; provider_username: string; first_name: string; last_name: string; profile_image?: string | null }[]; pagination: { total: number } }>('/services/list.php', {
      category: request.category,
      limit: 4,
    })
      .then((data) => setMatchingProviders({ total: data.pagination.total, services: data.services }))
      .catch(() => {});
  }, [request?.category, request?.requester_id, user]);

  const handleProposalSubmit = async (proposal: {
    requestId: string;
    price: string;
    message: string;
    scheduledDate: string;
    scheduledTime: string;
  }) => {
    setSubmitting(true);
    try {
      await apiPost('/requests/proposals.php', {
        request_id: proposal.requestId,
        price: proposal.price,
        message: proposal.message,
        scheduled_date: proposal.scheduledDate,
        scheduled_time: proposal.scheduledTime,
      });
      setHasSubmitted(true);
      // Re-fetch so myProposal card appears immediately
      const fresh = await apiGet<RequestResponse>('/requests/get.php', { id });
      setRequest(fresh.request);
    } catch (err) {
      console.error('Proposal submission failed:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Accept a proposal (owner only)
  const handleAcceptProposal = async (proposalId: number) => {
    if (!window.confirm('Accept this proposal? Payment will be deducted from your balance and all other proposals will be declined.')) return;
    setRespondingId(proposalId);
    try {
      await apiPatch(`/requests/proposals-respond.php?id=${proposalId}`, { action: 'accept' });
      toast.success('Proposal accepted! Order created.');
      // Refresh data
      const data = await apiGet<RequestResponse>('/requests/get.php', { id });
      setRequest(data.request);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to accept proposal');
    } finally {
      setRespondingId(null);
    }
  };

  // Reject a proposal (owner only)
  const handleRejectProposal = async (proposalId: number) => {
    if (!window.confirm('Decline this proposal?')) return;
    setRespondingId(proposalId);
    try {
      await apiPatch(`/requests/proposals-respond.php?id=${proposalId}`, { action: 'reject' });
      toast.success('Proposal declined');
      // Refresh data
      const data = await apiGet<RequestResponse>('/requests/get.php', { id });
      setRequest(data.request);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to decline proposal');
    } finally {
      setRespondingId(null);
    }
  };

  // Detect the current user's own proposal (for non-owners)
  const myProposal = (!loading && request && user && user.id !== request.requester_id)
    ? (request.proposals ?? []).find(p => p.provider_id === user.id) ?? null
    : null;

  // If proposal was rejected, silently redirect away
  useEffect(() => {
    if (myProposal?.status === 'rejected') {
      navigate('/discover', { replace: true });
    }
  }, [myProposal?.status, navigate]);

  // Delete request (owner only)
  const handleDeleteRequest = async () => {
    if (!request) return;
    if (!window.confirm('Are you sure you want to delete this request? This will also remove all proposals.')) return;
    setDeleting(true);
    try {
      await apiDelete('/requests/delete.php', { id: String(request.id) });
      toast.success('Request deleted');
      navigate('/discover');
    } catch {
      toast.error('Failed to delete request');
    } finally {
      setDeleting(false);
    }
  };

  // Start editing own proposal
  const startEditProposal = (proposal: Proposal) => {
    setEditPrice(String(proposal.price));
    setEditMessage(proposal.message);
    setEditScheduledDate(proposal.scheduled_date ?? '');
    setEditScheduledTime(proposal.scheduled_time ?? '');
    setEditingProposal(true);
  };

  // Save edited proposal
  const handleSaveProposal = async (proposalId: number) => {
    if (!editPrice || !editMessage) {
      toast.error('Price and message are required');
      return;
    }
    setSavingEdit(true);
    try {
      await apiPatch(`/requests/proposals.php?id=${proposalId}`, {
        price: editPrice,
        message: editMessage,
        scheduled_date: editScheduledDate || null,
        scheduled_time: editScheduledTime || null,
      });
      toast.success('Proposal updated');
      setEditingProposal(false);
      // Refresh the page data
      const data = await apiGet<RequestResponse>('/requests/get.php', { id });
      setRequest(data.request);
    } catch {
      toast.error('Failed to update proposal');
    } finally {
      setSavingEdit(false);
    }
  };

  // Withdraw own proposal
  const handleWithdrawProposal = async (proposalId: number) => {
    if (!window.confirm('Withdraw your proposal? This cannot be undone.')) return;
    setWithdrawing(true);
    try {
      await apiDelete(`/requests/proposals.php`, { id: String(proposalId) });
      toast.success('Proposal withdrawn');
      setHasSubmitted(false);
      setEditingProposal(false);
      // Refresh page data
      const data = await apiGet<RequestResponse>('/requests/get.php', { id });
      setRequest(data.request);
    } catch {
      toast.error('Failed to withdraw proposal');
    } finally {
      setWithdrawing(false);
    }
  };

  // Start editing request (owner only)
  const startEditRequest = () => {
    if (!request) return;
    // Find the budget_range value that matches the current budget label
    const matchedRange = BUDGET_RANGES.find(r => r.label === request.budget);
    setEditData({
      title: request.title,
      description: request.description,
      category: request.category,
      budget_range: matchedRange?.value ?? request.budget_range ?? '',
      deadline: request.deadline ?? '',
    });
    setIsEditing(true);
  };

  // Save edited request
  const handleSaveRequest = async () => {
    if (!request || !id) return;
    if (!editData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!editData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!editData.category) {
      toast.error('Category is required');
      return;
    }
    if (!editData.budget_range) {
      toast.error('Budget range is required');
      return;
    }
    setSavingRequest(true);
    try {
      await apiPatch(`/requests/update.php?id=${request.id}`, {
        title: editData.title.trim(),
        description: editData.description.trim(),
        category: editData.category,
        budget_range: editData.budget_range,
        deadline: editData.deadline || null,
      });
      // Refresh data from server
      const data = await apiGet<RequestResponse>('/requests/get.php', { id });
      setRequest(data.request);
      setIsEditing(false);
      toast.success('Request updated successfully');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update request');
    } finally {
      setSavingRequest(false);
    }
  };

  // Cancel editing request
  const cancelEditRequest = () => {
    setIsEditing(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { toast.error('Failed to copy link'); }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Back button */}
          <div className="h-4 w-20 bg-charcoal-100 rounded animate-pulse mb-6" />

          {/* Title + status badge */}
          <div className="h-7 w-2/3 bg-charcoal-100 rounded animate-pulse mb-2" />
          <div className="h-5 w-20 rounded-full bg-charcoal-100 animate-pulse mb-4" />

          {/* Requester row */}
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-charcoal-100 animate-pulse" />
            <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse" />
            <div className="h-3 w-24 bg-charcoal-100 rounded animate-pulse" />
          </div>

          {/* Details card */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 mb-8">
            {/* Badge row */}
            <div className="flex gap-2 mb-4">
              <div className="h-5 w-20 rounded-full bg-charcoal-100 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-charcoal-100 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-charcoal-100 animate-pulse" />
            </div>
            {/* 4 detail rows */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-charcoal-50">
                <div className="h-4 w-20 bg-charcoal-100 rounded animate-pulse" />
                <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-charcoal-100 rounded animate-pulse mb-8" />

          {/* Proposals section */}
          <div className="h-6 w-40 bg-charcoal-100 rounded animate-pulse mb-4" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-5 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-charcoal-100 animate-pulse" />
                <div className="h-4 w-28 bg-charcoal-100 rounded animate-pulse" />
                <div className="h-5 w-16 bg-charcoal-100 rounded animate-pulse ml-auto" />
              </div>
              <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-2/3 bg-charcoal-100 rounded animate-pulse mb-3" />
              <div className="flex gap-2">
                <div className="h-9 w-24 rounded-lg bg-charcoal-100 animate-pulse" />
                <div className="h-9 w-24 rounded-lg bg-charcoal-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-16 pt-8">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <h2 className="font-display italic text-2xl text-charcoal-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-charcoal-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 404 state
  if (notFound || !request) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-16 pt-8">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <h2 className="font-display italic text-2xl text-charcoal-900 mb-2">
              Request not found
            </h2>
            <p className="text-charcoal-600 mb-6">
              The request you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Back to Discover
            </button>
          </div>
        </div>
      </div>
    );
  }

  const requesterName = `${request.requester_first_name} ${request.requester_last_name}`;
  const deadline = formatDeadline(request.deadline);
  const isOwner = user?.id === request.requester_id;
  const isAdmin = user?.role === 'admin' && !user?.impersonating;
  const proposals = request.proposals ?? [];

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        {/* Back Button */}
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/discover')}
          className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-900 mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="font-sans text-sm font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 min-w-0 overflow-hidden">
            {/* Request Header */}
            <div className="bg-white border border-charcoal-100 rounded-2xl p-8 shadow-sm">
              {isEditing ? (
                /* ---- EDIT MODE ---- */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-sans font-bold text-lg text-charcoal-900">Edit Request</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEditRequest}
                        className="h-9 px-4 flex items-center gap-1.5 border-2 border-charcoal-200 text-charcoal-700 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                      >
                        <X className="size-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRequest}
                        disabled={savingRequest}
                        className="h-9 px-4 flex items-center gap-1.5 bg-honey-500 text-charcoal-900 rounded-xl font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50"
                      >
                        <Check className="size-4" />
                        {savingRequest ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      maxLength={150}
                      className="w-full h-14 px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all"
                    />
                    <CharacterLimitHint current={editData.title.length} max={150} />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                      Category
                    </label>
                    <CustomSelect
                      value={editData.category}
                      onChange={(value) => setEditData({ ...editData, category: value })}
                      options={CATEGORIES}
                      placeholder="Choose a category"
                    />
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-charcoal-900 mb-3">
                      Budget Range
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {BUDGET_RANGES.map((range) => (
                        <button
                          key={range.value}
                          type="button"
                          onClick={() => setEditData({ ...editData, budget_range: range.value })}
                          className={`h-14 rounded-xl border-2 font-sans font-medium text-sm transition-all ${
                            editData.budget_range === range.value
                              ? 'border-honey-500 bg-honey-50 text-charcoal-900 shadow-sm'
                              : 'border-charcoal-200 bg-white text-charcoal-600 hover:border-charcoal-300'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                      Deadline
                    </label>
                    <DatePicker
                      value={editData.deadline}
                      onChange={(date) => setEditData({ ...editData, deadline: date })}
                      placeholder="Select a deadline"
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-charcoal-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={8}
                      maxLength={2000}
                      className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 shadow-sm focus:outline-none focus:border-honey-500 focus:ring-4 focus:ring-honey-100 transition-all resize-none"
                    />
                    <CharacterLimitHint current={editData.description.length} max={2000} />
                  </div>

                  {/* Bottom Save/Cancel */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={cancelEditRequest}
                      className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 border-2 border-charcoal-200 text-charcoal-700 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                    >
                      <X className="size-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRequest}
                      disabled={savingRequest}
                      className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 bg-honey-500 text-charcoal-900 rounded-xl font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50"
                    >
                      <Check className="size-4" />
                      {savingRequest ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ---- VIEW MODE ---- */
                <>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="font-display italic text-3xl md:text-4xl text-charcoal-900 flex-1">
                      {sanitizeContent(request.title)}
                    </h1>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyLink}
                        title={linkCopied ? 'Copied!' : 'Share link'}
                        className="h-9 px-2 sm:px-3 flex items-center gap-1.5 rounded-lg border border-charcoal-200 text-charcoal-600 text-sm font-medium hover:bg-charcoal-50 transition-colors"
                      >
                        <Link2 className="size-3.5" />
                        <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
                      </button>
                      {isOwner && request.status === 'open' && (
                        <button
                          onClick={startEditRequest}
                          className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-charcoal-200 text-charcoal-600 text-sm font-medium hover:bg-charcoal-50 transition-colors"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap mb-6">
                    <span className="inline-block px-3 py-1.5 bg-honey-100 text-honey-700 text-sm font-medium rounded-full">
                      {request.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-100 text-charcoal-700 text-sm font-medium rounded-full">
                      <DollarSign className="size-3.5" />
                      Budget: {request.budget}
                    </span>
                    {deadline !== 'Ongoing' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                        <Calendar className="size-3.5" />
                        Due: {deadline}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-50 text-charcoal-700 text-sm font-medium rounded-full">
                      <User className="size-3.5" />
                      {request.proposal_count} proposal{request.proposal_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {(hasSubmitted || myProposal) && myProposal?.status !== 'rejected' && (
                    <div className="mb-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
                        myProposal?.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-honey-100 text-honey-700'
                      }`}>
                        <CheckCircle2 className="size-4" />
                        {myProposal?.status === 'accepted' ? 'Proposal Accepted' : 'Proposal Sent'}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-charcoal-100 pt-6">
                    <h2 className="font-sans font-bold text-lg text-charcoal-900 mb-3">
                      Description
                    </h2>
                    <p className="text-charcoal-700 leading-relaxed whitespace-pre-line">
                      {sanitizeContent(request.description)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Request Details */}
            <div className="bg-white border border-charcoal-100 rounded-2xl p-8 shadow-sm">
              <h2 className="font-sans font-bold text-lg text-charcoal-900 mb-4">
                Request Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="size-5 text-charcoal-500 mt-0.5" />
                  <div>
                    <div className="font-sans font-medium text-charcoal-900 text-sm">Budget Range</div>
                    <div className="text-charcoal-600 text-sm mt-0.5">{request.budget}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-charcoal-500 mt-0.5" />
                  <div>
                    <div className="font-sans font-medium text-charcoal-900 text-sm">
                      {deadline === 'Ongoing' ? 'Timeline' : 'Deadline'}
                    </div>
                    <div className="text-charcoal-600 text-sm mt-0.5">{deadline}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-charcoal-500 mt-0.5" />
                  <div>
                    <div className="font-sans font-medium text-charcoal-900 text-sm">Posted</div>
                    <div className="text-charcoal-600 text-sm mt-0.5">{formatDate(request.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Proposal — visible when non-owner has submitted */}
            {!isOwner && myProposal && (
              <div className="bg-white border border-charcoal-100 rounded-2xl p-8 shadow-sm min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-sans font-bold text-lg text-charcoal-900">
                    Your Proposal
                  </h2>
                  {!editingProposal && myProposal.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditProposal(myProposal)}
                        className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-charcoal-200 text-charcoal-600 text-xs font-medium hover:bg-charcoal-50 transition-colors"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleWithdrawProposal(myProposal.id)}
                        disabled={withdrawing}
                        className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="size-3" />
                        {withdrawing ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                    </div>
                  )}
                </div>

                {editingProposal ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                        Your Price
                      </label>
                      <CurrencyInput
                        value={editPrice}
                        onChange={(v) => setEditPrice(v)}
                        placeholder="Enter your price"
                        className="w-full h-12 pl-10 pr-4 bg-white border-2 border-charcoal-200 rounded-xl font-sans text-base text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                          Scheduled Date
                        </label>
                        <DatePicker
                          value={editScheduledDate}
                          onChange={setEditScheduledDate}
                          placeholder="Pick a date"
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                          Scheduled Time
                        </label>
                        <TimePicker
                          value={editScheduledTime}
                          onChange={setEditScheduledTime}
                          placeholder="Pick a time"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                        Your Message
                      </label>
                      <textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        rows={5}
                        maxLength={1000}
                        className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl font-sans text-base text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100 resize-none"
                      />
                      <CharacterLimitHint current={editMessage.length} max={1000} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setEditingProposal(false)}
                        className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 border-2 border-charcoal-200 text-charcoal-700 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
                      >
                        <X className="size-4" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveProposal(myProposal.id)}
                        disabled={savingEdit}
                        className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 bg-honey-500 text-charcoal-900 rounded-xl font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50"
                      >
                        <Save className="size-4" />
                        {savingEdit ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-charcoal-100 rounded-xl p-5 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-lg font-bold text-charcoal-900">
                        ⬡ {myProposal.price}
                      </span>
                      <span className="text-xs text-charcoal-400">
                        {timeAgo(myProposal.created_at)}
                      </span>
                    </div>
                    {myProposal.scheduled_date && (
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-3">
                        <Calendar className="size-3" />
                        Scheduled: {formatDate(myProposal.scheduled_date)}{myProposal.scheduled_time ? ` at ${myProposal.scheduled_time}` : ''}
                      </div>
                    )}
                    <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-line" style={{ wordBreak: 'break-all' }}>
                      {sanitizeContent(myProposal.message)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Proposals Section — visible to request owner */}
            {isOwner && (
              <div className="bg-white border border-charcoal-100 rounded-2xl p-4 sm:p-8 shadow-sm min-w-0">
                <h2 className="font-sans font-bold text-lg text-charcoal-900 mb-1">
                  Proposals ({proposals.length})
                </h2>
                <p className="text-sm text-charcoal-500 mb-6">
                  Review proposals from providers interested in your request
                </p>

                {proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="size-8 text-charcoal-200 mx-auto mb-2" />
                    <p className="text-charcoal-500 text-sm">No proposals yet. Hang tight!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((prop) => {
                      const providerName = `${prop.provider_first_name} ${prop.provider_last_name}`;
                      return (
                        <div
                          key={prop.id}
                          className="border border-charcoal-100 rounded-xl p-4 sm:p-5 hover:border-honey-300 transition-colors min-w-0"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <Avatar name={providerName} size="md" src={prop.provider_profile_image} />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                                <div className="min-w-0">
                                  <span className="font-sans font-bold text-charcoal-900">
                                    {providerName}
                                  </span>
                                  <span className="text-charcoal-400 text-sm ml-2">
                                    @{prop.provider_username}
                                  </span>
                                </div>
                                <span className="font-mono text-lg font-bold text-charcoal-900 whitespace-nowrap">
                                  ⬡ {prop.price}
                                </span>
                              </div>

                              {prop.scheduled_date && (
                                <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-2">
                                  <Calendar className="size-3" />
                                  Scheduled: {formatDate(prop.scheduled_date)}{prop.scheduled_time ? ` at ${prop.scheduled_time}` : ''}
                                </div>
                              )}

                              <p className="text-sm text-charcoal-700 leading-relaxed mb-3 whitespace-pre-line" style={{ wordBreak: 'break-all' }}>
                                {sanitizeContent(prop.message)}
                              </p>

                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs text-charcoal-400">
                                  {timeAgo(prop.created_at)}
                                </span>
                                <div className="flex items-center flex-wrap gap-2">
                                  {prop.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleAcceptProposal(prop.id)}
                                        disabled={respondingId !== null}
                                        className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                        style={{ background: '#16a34a', color: '#fff' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#15803d'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#16a34a'; }}
                                      >
                                        <Check className="size-3" />
                                        {respondingId === prop.id ? 'Accepting…' : 'Accept'}
                                      </button>
                                      <button
                                        onClick={() => handleRejectProposal(prop.id)}
                                        disabled={respondingId !== null}
                                        className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                                      >
                                        <XCircle className="size-3" />
                                        Decline
                                      </button>
                                    </>
                                  )}
                                  {prop.status === 'accepted' && (
                                    <span className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
                                      <CheckCircle2 className="size-3" />
                                      Accepted
                                    </span>
                                  )}
                                  {prop.status === 'rejected' && (
                                    <span className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-charcoal-100 text-charcoal-500 text-xs font-bold">
                                      <XCircle className="size-3" />
                                      Declined
                                    </span>
                                  )}
                                  <button
                                    onClick={() => navigate(`/messages?userId=${prop.provider_id}&ctxType=request&ctxId=${request.id}&ctxTitle=${encodeURIComponent(request.title)}`)}
                                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-charcoal-200 text-charcoal-600 text-xs font-medium hover:bg-charcoal-50 transition-colors"
                                  >
                                    <MessageCircle className="size-3" />
                                    Message
                                  </button>
                                  <button
                                    onClick={() => navigate(`/${prop.provider_username}`)}
                                    className="h-8 px-3 rounded-lg border border-charcoal-200 text-charcoal-600 text-xs font-medium hover:bg-charcoal-50 transition-colors"
                                  >
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Matching Providers — visible to request owner */}
            {isOwner && matchingProviders.total > 0 && (
              <div className="bg-white border border-charcoal-100 rounded-2xl p-4 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-sans font-bold text-lg text-charcoal-900">
                    Providers you can reach out to
                  </h2>
                  <button
                    onClick={() => navigate(`/discover?tab=services&category=${encodeURIComponent(request.category)}`)}
                    className="text-xs font-bold text-honey-700 hover:text-honey-800 flex items-center gap-1"
                  >
                    Browse all
                    <ArrowRight className="size-3" />
                  </button>
                </div>
                <p className="text-sm text-charcoal-500 mb-5">
                  {matchingProviders.total} provider{matchingProviders.total !== 1 ? 's offer' : ' offers'} {request.category} services
                </p>
                <div className="space-y-3">
                  {matchingProviders.services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => navigate(`/service/${svc.id}`)}
                      className="w-full text-left bg-cream-50 rounded-xl px-4 py-3.5 border border-charcoal-100 hover:border-honey-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-sm text-charcoal-900 font-bold truncate">{svc.title}</span>
                        <span className="font-mono text-sm font-bold text-charcoal-900 shrink-0">
                          ⬡ {svc.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-charcoal-500">
                        <span>{svc.first_name} {svc.last_name}</span>
                        {svc.review_count > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 fill-honey-500 text-honey-500 stroke-0" />
                            {svc.rating} ({svc.review_count})
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Requester Info / Owner Badge */}
            <div className="bg-white border border-charcoal-100 rounded-2xl p-6 shadow-sm sticky top-24">
              {isOwner ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-2.5 py-1 bg-honey-100 text-honey-700 text-xs font-bold rounded-full">
                      Your Request
                    </div>
                  </div>
                  <p className="text-sm text-charcoal-600 mb-4">
                    {proposals.length === 0
                      ? 'No proposals yet. Your request is visible to all providers.'
                      : `You have ${proposals.length} proposal${proposals.length !== 1 ? 's' : ''} to review.`}
                  </p>
                  <button
                    onClick={handleDeleteRequest}
                    disabled={deleting}
                    className="w-full h-10 px-4 flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 rounded-xl font-sans font-bold text-sm transition-all hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    {deleting ? 'Deleting…' : 'Delete Request'}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-4">
                    Posted By
                  </h3>
                  <div
                    className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/${request.requester_username}`)}
                  >
                    <Avatar name={requesterName} size={56} frame={request.cosmetics?.frame ?? null} src={request.requester_profile_image} />
                    <div>
                      <div className="font-sans font-bold text-charcoal-900 hover:text-honey-600 transition-colors">
                        {requesterName}
                      </div>
                      <div className="text-xs text-charcoal-500">
                        @{request.requester_username}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  {(hasSubmitted || myProposal) ? (
                    myProposal?.status === 'accepted' ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="size-5 text-green-700" />
                          <span className="font-sans font-bold text-sm text-green-900">
                            Proposal Accepted!
                          </span>
                        </div>
                        <p className="text-xs text-green-700">
                          {request.requester_first_name} accepted your proposal. Check your dashboard for next steps.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-honey-50 border border-honey-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="size-5 text-honey-700" />
                          <span className="font-sans font-bold text-sm text-honey-900">
                            Proposal Sent
                          </span>
                        </div>
                        <p className="text-xs text-honey-700">
                          You'll be notified when {request.requester_first_name} responds to your proposal.
                        </p>
                      </div>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={submitting || isAdmin}
                        className={`w-full h-12 px-6 rounded-xl font-sans font-bold text-sm transition-all mb-3 ${
                          isAdmin
                            ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed'
                            : 'bg-honey-500 text-charcoal-900 hover:bg-honey-600 hover:scale-[1.02] shadow-lg disabled:opacity-50'
                        }`}
                      >
                        Submit Your Proposal
                      </button>
                      <p className="text-xs text-charcoal-500 text-center">
                        {request.proposal_count} provider{request.proposal_count !== 1 ? 's have' : ' has'} already submitted proposals
                      </p>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Tips Card — only for non-owners */}
            {!isOwner && (
              <div className="bg-honey-50 border border-honey-200 rounded-2xl p-6">
                <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-3">
                  Proposal Tips
                </h3>
                <ul className="space-y-2 text-xs text-charcoal-700">
                  <li className="flex gap-2">
                    <span className="text-honey-600">•</span>
                    <span>Be clear about what you'll deliver</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-honey-600">•</span>
                    <span>Price competitively but fairly</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-honey-600">•</span>
                    <span>Highlight relevant experience</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-honey-600">•</span>
                    <span>Set a realistic timeline</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proposal Modal — only for non-owners who haven't submitted yet */}
      {!isOwner && !myProposal && (
        <ProposalModal
          request={{
            id: String(request.id),
            title: request.title,
            description: request.description,
            category: request.category,
            budget: request.budget,
            deadline: deadline,
            requester: requesterName,
          }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleProposalSubmit}
        />
      )}
    </div>
  );
}
