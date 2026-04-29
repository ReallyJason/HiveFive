import { ArrowRight, BadgeDollarSign, CheckCheck, CheckCircle2, CircleSlash, Flag, PlayCircle, ShieldAlert, ShieldCheck, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const ORDER_EVENT_PREFIX = '[[HIVE_ORDER_EVENT_V1]]';

export interface OrderEventMessagePayload {
  version: 1;
  event: string;
  title: string;
  summary: string;
  orderId: number;
  serviceTitle: string;
  statusLabel?: string;
  actorRole?: 'client' | 'provider' | 'system';
  amountLabel?: string;
}

interface OrderEventTheme {
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
  accentPanel: string;
  border: string;
  shadow: string;
  eyebrow: string;
}

interface ParticipantNames {
  clientName: string | null;
  providerName: string | null;
  actorName: string | null;
}

function isOrderEventPayload(value: unknown): value is OrderEventMessagePayload {
  if (!value || typeof value !== 'object') return false;

  const payload = value as Record<string, unknown>;
  return (
    payload.version === 1
    && typeof payload.event === 'string'
    && typeof payload.title === 'string'
    && typeof payload.summary === 'string'
    && typeof payload.orderId === 'number'
    && Number.isFinite(payload.orderId)
    && typeof payload.serviceTitle === 'string'
    && (payload.statusLabel === undefined || typeof payload.statusLabel === 'string')
    && (payload.actorRole === undefined || payload.actorRole === 'client' || payload.actorRole === 'provider' || payload.actorRole === 'system')
    && (payload.amountLabel === undefined || typeof payload.amountLabel === 'string')
  );
}

export function parseOrderEventMessage(body: string): OrderEventMessagePayload | null {
  if (!body.startsWith(ORDER_EVENT_PREFIX)) return null;

  try {
    const payload = JSON.parse(body.slice(ORDER_EVENT_PREFIX.length));
    return isOrderEventPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

function themeForEvent(event: string): OrderEventTheme {
  switch (event) {
    case 'created':
      return {
        icon: ShoppingBag,
        accent: '#756B60',
        accentSoft: '#F1ECE6',
        accentPanel: '#FBF7F2',
        border: '#E7DDD1',
        shadow: 'rgba(117, 107, 96, 0.16)',
        eyebrow: '#8E8173',
      };
    case 'started':
      return {
        icon: PlayCircle,
        accent: '#B7791F',
        accentSoft: '#FBECCD',
        accentPanel: '#FFF8EA',
        border: '#EFD5A5',
        shadow: 'rgba(183, 121, 31, 0.18)',
        eyebrow: '#A46C1D',
      };
    case 'awaiting_completion':
      return {
        icon: CheckCheck,
        accent: '#4C7FBA',
        accentSoft: '#EAF2FB',
        accentPanel: '#F4F9FF',
        border: '#CFE0F3',
        shadow: 'rgba(76, 127, 186, 0.18)',
        eyebrow: '#557EAB',
      };
    case 'topup_requested':
      return {
        icon: BadgeDollarSign,
        accent: '#4C7FBA',
        accentSoft: '#EAF2FB',
        accentPanel: '#F4F9FF',
        border: '#CFE0F3',
        shadow: 'rgba(76, 127, 186, 0.18)',
        eyebrow: '#557EAB',
      };
    case 'topup_accepted':
      return {
        icon: CheckCircle2,
        accent: '#25865A',
        accentSoft: '#E5F5EC',
        accentPanel: '#F1FAF5',
        border: '#C6E6D5',
        shadow: 'rgba(37, 134, 90, 0.18)',
        eyebrow: '#2E7A59',
      };
    case 'topup_declined':
      return {
        icon: CircleSlash,
        accent: '#B35E55',
        accentSoft: '#F8E7E4',
        accentPanel: '#FDF3F1',
        border: '#E7CBC7',
        shadow: 'rgba(179, 94, 85, 0.18)',
        eyebrow: '#A1655D',
      };
    case 'completed':
    case 'auto_completed':
      return {
        icon: CheckCircle2,
        accent: '#25865A',
        accentSoft: '#E5F5EC',
        accentPanel: '#F1FAF5',
        border: '#C6E6D5',
        shadow: 'rgba(37, 134, 90, 0.18)',
        eyebrow: '#2E7A59',
      };
    case 'cancelled':
      return {
        icon: CircleSlash,
        accent: '#B35E55',
        accentSoft: '#F8E7E4',
        accentPanel: '#FDF3F1',
        border: '#E7CBC7',
        shadow: 'rgba(179, 94, 85, 0.18)',
        eyebrow: '#A1655D',
      };
    case 'disputed':
      return {
        icon: ShieldAlert,
        accent: '#C27A2D',
        accentSoft: '#FCEAD4',
        accentPanel: '#FFF6EB',
        border: '#EFCDA5',
        shadow: 'rgba(194, 122, 45, 0.18)',
        eyebrow: '#B07231',
      };
    case 'split_proposed':
      return {
        icon: Flag,
        accent: '#C27A2D',
        accentSoft: '#FCEAD4',
        accentPanel: '#FFF6EB',
        border: '#EFCDA5',
        shadow: 'rgba(194, 122, 45, 0.18)',
        eyebrow: '#B07231',
      };
    case 'split_accepted':
    case 'dispute_withdrawn':
    case 'auto_resolved':
      return {
        icon: ShieldCheck,
        accent: '#25865A',
        accentSoft: '#E5F5EC',
        accentPanel: '#F1FAF5',
        border: '#C6E6D5',
        shadow: 'rgba(37, 134, 90, 0.18)',
        eyebrow: '#2E7A59',
      };
    case 'tip_sent':
      return {
        icon: BadgeDollarSign,
        accent: '#B7791F',
        accentSoft: '#FBECCD',
        accentPanel: '#FFF8EA',
        border: '#EFD5A5',
        shadow: 'rgba(183, 121, 31, 0.18)',
        eyebrow: '#A46C1D',
      };
    default:
      return {
        icon: ShoppingBag,
        accent: '#756B60',
        accentSoft: '#F1ECE6',
        accentPanel: '#FBF7F2',
        border: '#E7DDD1',
        shadow: 'rgba(117, 107, 96, 0.16)',
        eyebrow: '#8E8173',
      };
  }
}

function resolveParticipantNames(
  event: OrderEventMessagePayload,
  senderId: number,
  viewerId: number | null,
  viewerName?: string,
  otherUserName?: string,
): ParticipantNames {
  const cleanViewerName = viewerName?.trim() || null;
  const cleanOtherUserName = otherUserName?.trim() || null;

  if (event.actorRole === 'system') {
    return {
      clientName: null,
      providerName: null,
      actorName: null,
    };
  }

  const senderIsViewer = viewerId !== null && senderId === viewerId;
  const actorName = senderIsViewer ? cleanViewerName : cleanOtherUserName;

  if (event.actorRole === 'client') {
    return {
      clientName: senderIsViewer ? cleanViewerName : cleanOtherUserName,
      providerName: senderIsViewer ? cleanOtherUserName : cleanViewerName,
      actorName,
    };
  }

  if (event.actorRole === 'provider') {
    return {
      clientName: senderIsViewer ? cleanOtherUserName : cleanViewerName,
      providerName: senderIsViewer ? cleanViewerName : cleanOtherUserName,
      actorName,
    };
  }

  return {
    clientName: null,
    providerName: null,
    actorName,
  };
}

function personalizeSummary(summary: string, names: ParticipantNames): string {
  let next = summary;

  if (names.providerName) {
    next = next.replace(/\bthe provider\b/gi, names.providerName);
    next = next.replace(/\bProvider\b/g, names.providerName);
    next = next.replace(/\bprovider\b/g, names.providerName);
  }

  if (names.clientName) {
    next = next.replace(/\bthe client\b/gi, names.clientName);
    next = next.replace(/\bClient\b/g, names.clientName);
    next = next.replace(/\bclient\b/g, names.clientName);
  }

  return next;
}

function actorLabel(actorRole?: OrderEventMessagePayload['actorRole'], actorName?: string | null): string {
  if (actorName) return `Updated by ${actorName}`;
  if (actorRole === 'system') return 'Automatic order update';
  return 'Order activity';
}

export function OrderEventMessageCard({
  event,
  onOpen,
  senderId,
  viewerId,
  viewerName,
  otherUserName,
}: {
  event: OrderEventMessagePayload;
  onOpen: () => void;
  senderId: number;
  viewerId: number | null;
  viewerName?: string;
  otherUserName?: string;
}) {
  const theme = themeForEvent(event.event);
  const Icon = theme.icon;
  const names = resolveParticipantNames(event, senderId, viewerId, viewerName, otherUserName);
  const summary = personalizeSummary(event.summary, names);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full max-w-2xl overflow-hidden rounded-[30px] p-4 text-left transition-all hover:-translate-y-0.5 sm:rounded-[38px] sm:p-5"
      style={{
        border: `1px solid ${theme.border}`,
        background: `linear-gradient(140deg, #ffffff 0%, ${theme.accentPanel} 100%)`,
        boxShadow: `0 22px 42px -30px ${theme.shadow}`,
      }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl"
        style={{ background: `${theme.accent}20`, transform: 'translate(30%, -30%)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/55 to-transparent" />
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-[20px] sm:size-12 sm:rounded-[22px]"
          style={{
            background: theme.accentSoft,
            color: theme.accent,
            boxShadow: `inset 0 0 0 1px ${theme.border}`,
          }}
        >
          <Icon className="size-5" strokeWidth={2.1} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p
                className="text-[11px] uppercase"
                style={{ letterSpacing: '0.16em' }}
              >
                <span style={{ color: theme.eyebrow }}>
                  Order Update
                </span>
              </p>
              <h3 className="mt-1 text-base font-semibold text-charcoal-900">
                {event.title}
              </h3>
            </div>

            {event.statusLabel && (
              <div className="self-start">
                <StatusBadge status={event.statusLabel} />
              </div>
            )}
          </div>

          <div
            className="mt-4 rounded-[24px] p-[1px] sm:rounded-[30px]"
            style={{
              background: `linear-gradient(150deg, rgba(255,255,255,0.96) 0%, ${theme.border} 100%)`,
              boxShadow: `0 16px 30px -28px ${theme.shadow}`,
            }}
          >
            <div
              className="rounded-[23px] px-3.5 py-3.5 sm:rounded-[29px] sm:px-4 sm:py-4"
              style={{
                background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${theme.accentPanel} 100%)`,
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[11px] uppercase"
                    style={{ letterSpacing: '0.14em', color: theme.eyebrow }}
                  >
                    Order #{event.orderId}
                  </div>
                  <p className="mt-2 text-base font-semibold leading-snug text-charcoal-900 break-words">
                    {event.serviceTitle}
                  </p>
                </div>

                {event.amountLabel && (
                  <span
                    className="self-start shrink-0 rounded-full px-3 py-1.5 text-xs font-mono"
                    style={{
                      background: theme.accentSoft,
                      color: theme.accent,
                      boxShadow: `inset 0 0 0 1px ${theme.border}`,
                    }}
                  >
                    {event.amountLabel}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-7 text-charcoal-700">
                {summary}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span
              className="inline-flex min-w-0 max-w-[65%] items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
              style={{
                letterSpacing: '0.14em',
                color: theme.eyebrow,
                background: 'rgba(255,255,255,0.55)',
                boxShadow: `inset 0 0 0 1px ${theme.border}`,
              }}
            >
              <span className="truncate whitespace-nowrap">
                {actorLabel(event.actorRole, names.actorName)}
              </span>
            </span>
            <span
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all group-hover:translate-x-0.5"
              style={{
                color: theme.accent,
                background: `${theme.accent}12`,
                boxShadow: `inset 0 0 0 1px ${theme.border}`,
              }}
            >
              Open order
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
