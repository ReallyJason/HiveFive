import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { CurrencyInput } from './CurrencyInput';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { CharacterLimitHint } from './CharacterLimitHint';
import { sanitizeContent } from '../lib/contentFilter';

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  requester: string;
}

interface ProposalModalProps {
  request: Request;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposal: {
    requestId: string;
    price: string;
    message: string;
    scheduledDate: string;
    scheduledTime: string;
  }) => Promise<void>;
}

export function ProposalModal({ request, isOpen, onClose, onSubmit }: ProposalModalProps) {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!price || !message || !scheduledDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        requestId: request.id,
        price,
        message,
        scheduledDate,
        scheduledTime,
      });

      toast.success('Proposal sent! You\'ll be notified when they respond');

      // Reset form
      setPrice('');
      setMessage('');
      setScheduledDate('');
      setScheduledTime('');

      onClose();
    } catch {
      toast.error('Failed to submit proposal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white border-b border-charcoal-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="font-display italic text-2xl text-charcoal-900">
                Submit Your Proposal
              </h2>
              <p className="text-sm text-charcoal-600 mt-0.5">
                Respond to {request.requester}'s request
              </p>
            </div>
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-charcoal-100 transition-colors"
            >
              <X className="size-5 text-charcoal-600" />
            </button>
          </div>

          {/* Request Context */}
          <div className="bg-honey-50 border-b border-honey-200 px-6 py-4">
            <h3 className="font-sans font-bold text-charcoal-900 mb-2">
              {sanitizeContent(request.title)}
            </h3>
            <p className="text-sm text-charcoal-700 mb-3 leading-relaxed">
              {sanitizeContent(request.description)}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block px-3 py-1 bg-honey-100 text-honey-700 font-medium rounded-full">
                  {request.category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="size-4 text-charcoal-500" />
                <span className="text-charcoal-700">
                  <span className="font-medium">Budget:</span> {request.budget}
                </span>
              </div>
              {request.deadline !== 'Ongoing' && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-charcoal-500" />
                  <span className="text-charcoal-700">
                    <span className="font-medium">Deadline:</span> {request.deadline}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="font-sans font-bold text-charcoal-900 mb-4 text-lg">
                Your Proposal
              </h3>

              {/* Price Input */}
              <div className="mb-5">
                <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                  Your Price <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={price}
                  onChange={(value) => setPrice(value)}
                  placeholder="Enter your price"
                  className="w-full h-14 pl-10 pr-4 bg-white border-2 border-charcoal-200 rounded-xl font-sans text-base text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100 shadow-sm"
                />
                <p className="text-xs text-charcoal-500 mt-1.5">
                  Their budget: {request.budget}
                </p>
              </div>

              {/* Scheduled Date & Time */}
              <div className="mb-5">
                <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  placeholder="Pick a date"
                  minDate={minDate}
                />
              </div>

              <div className="mb-5">
                <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                  Preferred Time <span className="text-charcoal-400">(optional)</span>
                </label>
                <TimePicker
                  value={scheduledTime}
                  onChange={setScheduledTime}
                  selectedDate={scheduledDate}
                  placeholder="Pick a time"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this request..."
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-white border-2 border-charcoal-200 rounded-xl font-sans text-base text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100 shadow-sm resize-none"
                />
                <CharacterLimitHint current={message.length} max={1000} min={50} align="left" className="mt-1.5" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-charcoal-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 px-6 bg-white border-2 border-charcoal-200 text-charcoal-700 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !price || !message || message.length < 50 || !scheduledDate}
                className="flex-1 h-12 px-6 bg-honey-500 text-charcoal-900 rounded-xl font-sans font-bold text-sm transition-all hover:bg-honey-600 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {submitting ? 'Submitting…' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
