import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../lib/auth';
import type { FrameData, BadgeData } from '../lib/auth';
import { apiGet, apiPost, ApiError } from '../lib/api';
import { Send, Search, ArrowLeft, Loader2, FileText, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import { LinkPreviewCard } from '../components/LinkPreviewCard';
import type { LinkPreviewProps } from '../components/LinkPreviewCard';
import { OrderEventMessageCard, parseOrderEventMessage } from '../components/OrderEventMessageCard';
import { parseUTC } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { playAlertSound } from '../lib/inAppAlerts';
import { MessageAttachmentGrid, type MessageAttachmentItem } from '../components/MessageAttachmentGrid';
import { CHAT_ATTACHMENT_ACCEPT, formatFileSize, getChatAttachmentMeta, readFileAsDataUrl } from '../lib/fileUploads';
import { toast } from 'sonner';
import { sanitizeContent } from '../lib/contentFilter';

interface ConversationContext {
  type: string;
  id: number;
  title: string;
}

interface CosmeticsPayload {
  frame: FrameData | null;
  badge: BadgeData | null;
}

interface Conversation {
  conversation_id: number;
  other_user: {
    id: number;
    name: string;
    initial: string;
    username: string;
    profile_image: string;
    online: boolean;
    cosmetics?: CosmeticsPayload;
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
  context_type: string | null;
  context_id: number | null;
  context_title: string | null;
}

interface Message {
  id: number;
  sender_id: number;
  body: string;
  created_at: string;
  read_at: string | null;
  attachments: MessageAttachmentItem[];
  sender?: {
    first_name: string;
    last_name: string;
    username: string;
    profile_image: string | null;
  };
}

interface ComposerAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'file';
  dataUrl: string;
}

const MAX_CHAT_ATTACHMENTS = 5;
const MAX_CHAT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function describePendingAttachment(attachment: ComposerAttachment): string {
  if (attachment.kind === 'image') {
    if (attachment.mimeType === 'image/heic' || attachment.mimeType === 'image/heif') return 'iPhone photo';
    if (attachment.mimeType === 'image/avif') return 'AVIF photo';
    return 'Photo';
  }

  const extension = attachment.name.split('.').pop()?.trim();
  return extension ? `${extension.toUpperCase()} file` : 'File';
}

export function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId') ? Number(searchParams.get('userId')) : null;
  const targetConversationId = searchParams.get('conversationId') ? Number(searchParams.get('conversationId')) : null;
  const paramContextType = searchParams.get('ctxType');
  const paramContextId = searchParams.get('ctxId') ? Number(searchParams.get('ctxId')) : null;
  const paramContextTitle = searchParams.get('ctxTitle');

  // --- Conversation list state ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convoLoading, setConvoLoading] = useState(true);
  const [convoError, setConvoError] = useState<string | null>(null);

  // --- Selected conversation & messages state ---
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  // --- New conversation state (when messaging someone for the first time) ---
  const [newChatUser, setNewChatUser] = useState<{
    id: number;
    name: string;
    username: string;
    profile_image: string | null;
  } | null>(null);

  // --- Context passed via URL params (before it's stored on the conversation) ---
  const [pendingContext, setPendingContext] = useState<ConversationContext | null>(
    paramContextType && paramContextId && paramContextTitle
      ? { type: paramContextType, id: paramContextId, title: paramContextTitle }
      : null
  );

  // --- UI state ---
  const [messageText, setMessageText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ComposerAttachment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [dismissedContextKey, setDismissedContextKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const lastIncomingMessageIdRef = useRef<number | null>(null);

  // Track whether the tab is visible (pause polling when hidden)
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Scroll to bottom only when new messages actually arrive
  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1].id;
    if (lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // --- Fetch conversations (initial + polling every 10s) ---
  const fetchConversations = useCallback(async (isInitial: boolean) => {
    if (isInitial) {
      setConvoLoading(true);
      setConvoError(null);
    }
    try {
      const data = await apiGet<{ conversations: Conversation[] }>('/messages/conversations.php');
      setConversations(data.conversations);
    } catch (err) {
      if (isInitial) {
        setConvoError(err instanceof ApiError ? err.message : 'Failed to load conversations');
      }
    } finally {
      if (isInitial) setConvoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  useEffect(() => {
    if (convoLoading || !tabVisible) return;
    const id = setInterval(() => fetchConversations(false), 10_000);
    return () => clearInterval(id);
  }, [convoLoading, tabVisible, fetchConversations]);

  // --- Handle userId query param after conversations load ---
  useEffect(() => {
    if (convoLoading || !targetUserId) return;

    // Check if we already have a conversation with this user
    const existing = conversations.find((c) => c.other_user.id === targetUserId);
    if (existing) {
      setSelectedConvo(existing);
      setNewChatUser(null);
      setShowChat(true);
      setSearchParams({ conversationId: String(existing.conversation_id) }, { replace: true });
      return;
    }

    // No existing conversation — fetch user profile and open a new chat
    let cancelled = false;
    async function fetchTargetUser() {
      try {
        const data = await apiGet<{
          user: { id: number; first_name: string; last_name: string; username: string; profile_image: string | null };
        }>('/users/profile.php', { id: targetUserId! });
        if (cancelled) return;
        setNewChatUser({
          id: data.user.id,
          name: `${data.user.first_name} ${data.user.last_name}`.trim(),
          username: data.user.username,
          profile_image: data.user.profile_image,
        });
        setSelectedConvo(null);
        setMessages([]);
        setShowChat(true);
        setSearchParams({}, { replace: true });
      } catch {
        // If profile fetch fails, just ignore
      }
    }
    fetchTargetUser();
    return () => { cancelled = true; };
  }, [convoLoading, targetUserId, conversations, setSearchParams]);

  useEffect(() => {
    if (convoLoading || !targetConversationId) return;

    const existing = conversations.find((c) => c.conversation_id === targetConversationId);
    if (!existing) return;

    setSelectedConvo(existing);
    setNewChatUser(null);
    setShowChat(true);
  }, [convoLoading, targetConversationId, conversations]);

  // --- Fetch messages for selected conversation (initial + polling every 5s) ---
  const fetchMessages = useCallback(async (conversationId: number, isInitial: boolean) => {
    if (isInitial) {
      setMsgLoading(true);
      setMsgError(null);
    }
    try {
      const data = await apiGet<{ messages: Message[] }>('/messages/messages.php', {
        conversation_id: conversationId,
      });
      const latestIncomingId = [...data.messages].reverse().find((message) => message.sender_id !== user?.id)?.id ?? null;
      const latestMessage = data.messages[data.messages.length - 1] ?? null;

      setMessages((prev) => {
        const newLast = data.messages[data.messages.length - 1]?.id;
        const prevLast = prev[prev.length - 1]?.id;
        // Same last message ID and same count — check if read_at changed
        if (prev.length === data.messages.length && prevLast === newLast) {
          // Check if any read_at value changed (for read receipt updates)
          const readChanged = data.messages.some(
            (m, i) => m.read_at !== prev[i]?.read_at
          );
          if (!readChanged) return prev;
        }
        return data.messages;
      });

      if (isInitial) {
        lastIncomingMessageIdRef.current = latestIncomingId;
      } else if (
        latestMessage
        && latestMessage.sender_id !== user?.id
        && latestMessage.id !== lastIncomingMessageIdRef.current
      ) {
        lastIncomingMessageIdRef.current = latestMessage.id;
        playAlertSound('message');
      } else {
        lastIncomingMessageIdRef.current = latestIncomingId;
      }
    } catch (err) {
      if (isInitial) {
        setMsgError(err instanceof ApiError ? err.message : 'Failed to load messages');
      }
    } finally {
      if (isInitial) setMsgLoading(false);
    }
  }, [user?.id]);

  const selectedConvoId = selectedConvo?.conversation_id ?? null;

  useEffect(() => {
    lastMessageIdRef.current = null;
    lastIncomingMessageIdRef.current = null;
  }, [selectedConvoId]);

  useEffect(() => {
    setPendingAttachments([]);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, [selectedConvoId, newChatUser?.id]);

  useEffect(() => {
    if (selectedConvoId) {
      fetchMessages(selectedConvoId, true);
    }
  }, [selectedConvoId, fetchMessages]);

  useEffect(() => {
    if (!selectedConvoId || !tabVisible) return;
    const id = setInterval(() => fetchMessages(selectedConvoId, false), 5_000);
    return () => clearInterval(id);
  }, [selectedConvoId, tabVisible, fetchMessages]);

  // --- Filtering ---
  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Send message ---
  const handleSendMessage = async () => {
    if ((!messageText.trim() && pendingAttachments.length === 0) || sending) return;

    // Must have either a selected conversation or a new chat target
    if (!selectedConvo && !newChatUser) return;

    const body = messageText.trim();
    const attachmentSnapshot = pendingAttachments;
    const attachmentsToSend = attachmentSnapshot.map((attachment) => ({
      name: attachment.name,
      type: attachment.mimeType,
      data_url: attachment.dataUrl,
    }));
    setSending(true);
    setMessageText('');
    setPendingAttachments([]);

    try {
      const payload: Record<string, unknown> = { body };
      if (attachmentsToSend.length > 0) {
        payload.attachments = attachmentsToSend;
      }

      if (selectedConvo) {
        payload.conversation_id = selectedConvo.conversation_id;
      } else if (newChatUser) {
        payload.recipient_id = newChatUser.id;
      }

      // Attach context if we have one pending (from URL params)
      if (pendingContext) {
        payload.context_type = pendingContext.type;
        payload.context_id = pendingContext.id;
        payload.context_title = pendingContext.title;
      }

      const data = await apiPost<{ conversation_preview: string; message: Message & { conversation_id: number } }>('/messages/send.php', payload);

      // Append the newly created message
      setMessages((prev) => [...prev, data.message]);

      // Context is now stored on the conversation — clear pending
      if (pendingContext) {
        if (selectedConvo) {
          setSelectedConvo({ ...selectedConvo, context_type: pendingContext.type, context_id: pendingContext.id, context_title: pendingContext.title });
        }
        setPendingContext(null);
      }

      if (selectedConvo) {
        // Update last_message + context in the conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === selectedConvo.conversation_id
              ? {
                  ...c,
                  last_message: data.conversation_preview,
                  last_message_at: new Date().toISOString(),
                  ...(pendingContext ? { context_type: pendingContext.type, context_id: pendingContext.id, context_title: pendingContext.title } : {}),
                }
              : c
          )
        );
      } else if (newChatUser) {
        // First message sent — refresh conversations to pick up the new one
        setNewChatUser(null);
        try {
          const convoData = await apiGet<{ conversations: Conversation[] }>('/messages/conversations.php');
          setConversations(convoData.conversations);
          // Select the newly created conversation
          const newConvo = convoData.conversations.find(
            (c) => c.conversation_id === data.message.conversation_id
          );
          if (newConvo) {
            setSelectedConvo(newConvo);
            setSearchParams({ conversationId: String(newConvo.conversation_id) }, { replace: true });
          }
        } catch {
          // Conversations will refresh next time
        }
      }
    } catch (err) {
      // Restore the text so the user can retry
      setMessageText(body);
      setPendingAttachments(attachmentSnapshot);
      toast.error(err instanceof ApiError ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const nextAttachments: ComposerAttachment[] = [];
    const remainingSlots = MAX_CHAT_ATTACHMENTS - pendingAttachments.length;

    if (remainingSlots <= 0) {
      toast.error(`You can send up to ${MAX_CHAT_ATTACHMENTS} attachments at a time`);
      e.target.value = '';
      return;
    }

    for (const file of files.slice(0, remainingSlots)) {
      const meta = getChatAttachmentMeta(file);
      if (!meta) {
        toast.error(`"${file.name}" is not a supported chat attachment`);
        continue;
      }

      if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
        toast.error(`"${file.name}" exceeds the 5MB per-file limit`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file, meta.mimeType);
        nextAttachments.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          mimeType: meta.mimeType,
          sizeBytes: file.size,
          kind: meta.kind,
          dataUrl,
        });
      } catch {
        toast.error(`"${file.name}" could not be attached`);
      }
    }

    if (files.length > remainingSlots) {
      toast.error(`Only ${MAX_CHAT_ATTACHMENTS} attachments can be sent at once`);
    }

    if (nextAttachments.length > 0) {
      setPendingAttachments((prev) => [...prev, ...nextAttachments]);
    }

    e.target.value = '';
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  const clearPendingAttachments = () => {
    setPendingAttachments([]);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConvo(conv);
    setNewChatUser(null);
    setPendingContext(null);
    setPendingAttachments([]);
    setShowChat(true);
    lastMessageIdRef.current = null;
    setSearchParams({ conversationId: String(conv.conversation_id) }, { replace: true });
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSearchParams({}, { replace: true });
  };

  // Derive active context: pending (from URL) takes priority, then conversation's stored context
  const activeContext: ConversationContext | null = pendingContext
    ?? (selectedConvo?.context_type && selectedConvo?.context_id && selectedConvo?.context_title
        ? { type: selectedConvo.context_type, id: selectedConvo.context_id, title: selectedConvo.context_title }
        : null);
  const activeContextKey = activeContext
    ? `${selectedConvo?.conversation_id ?? `new-${newChatUser?.id ?? 'pending'}`}:${activeContext.type}:${activeContext.id}:${activeContext.title}`
    : null;

  // --- Helpers ---
  function formatTimestamp(ts: string) {
    if (!ts) return '';
    const date = parseUTC(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatDateLabel(ts: string) {
    if (!ts) return '';
    const date = parseUTC(ts);
    if (isNaN(date.getTime())) return ts;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toLocaleDateString() === today.toLocaleDateString()) return 'Today';
    if (date.toLocaleDateString() === yesterday.toLocaleDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatConversationTimestamp(ts: string) {
    if (!ts) return '';
    const date = parseUTC(ts);
    if (isNaN(date.getTime())) return ts;

    const now = new Date();
    const msInYear = 365 * 24 * 60 * 60 * 1000;

    if (now.getTime() - date.getTime() < msInYear) {
      const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `${datePart} · ${timePart}`;
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renderMessageBody(text: string): { content: React.ReactNode; previews: LinkPreviewProps[] } {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const previews: LinkPreviewProps[] = [];
    const origin = window.location.origin;

    function normalizeHref(rawHref: string): string {
      return rawHref.replace(/[),.;!?]+$/g, '');
    }

    function collectPreviewForHref(href: string) {
      if (!href.startsWith(origin)) return;
      const path = href.slice(origin.length);
      const serviceMatch = path.match(/^\/service\/(\d+)/);
      const requestMatch = path.match(/^\/request\/(\d+)/);
      const userMatch = path.match(/^\/([a-zA-Z][a-zA-Z0-9_]{1,49})(?:\/|$|\?)/);

      if (serviceMatch) {
        previews.push({ type: 'service', id: parseInt(serviceMatch[1], 10) });
        return;
      }
      if (requestMatch) {
        previews.push({ type: 'request', id: parseInt(requestMatch[1], 10) });
        return;
      }
      if (userMatch && !['service', 'request', 'discover', 'login', 'signup', 'settings', 'dashboard', 'messages', 'orders', 'book', 'shop', 'search', 'leaderboard', 'verify', 'onboarding', 'profile', 'post-service', 'post-request', 'forgot-password', 'buzz-score', 'design-system', 'edit-service', 'service-published', 'request-published', 'notifications'].includes(userMatch[1])) {
        previews.push({ type: 'user', username: userMatch[1] });
      }
    }

    const previewSeen = new Set<string>();
    for (const match of text.matchAll(urlPattern)) {
      const normalized = normalizeHref(match[0]);
      const href = normalized.startsWith('www.') ? `https://${normalized}` : normalized;
      if (previewSeen.has(href)) continue;
      previewSeen.add(href);
      collectPreviewForHref(href);
    }

    const content = (
      <div className="space-y-2 text-sm leading-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="whitespace-pre-wrap leading-6">{children}</p>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-charcoal-300/70 pl-3 italic opacity-90">{children}</blockquote>
            ),
            ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
            li: ({ children }) => <li>{children}</li>,
            code: ({ className, children }) => {
              const isBlock = Boolean(className);
              return (
                <code
                  className={
                    isBlock
                      ? `font-mono text-[13px] ${className ?? ''}`
                      : 'rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[0.92em]'
                  }
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="overflow-x-auto rounded-xl bg-charcoal-950/90 p-3 text-cream-50">{children}</pre>
            ),
            a: ({ href, children }) => {
              const rawHref = href ?? '';
              const normalized = normalizeHref(rawHref);
              const resolvedHref = normalized.startsWith('www.') ? `https://${normalized}` : normalized;
              const path = resolvedHref.startsWith(origin)
                ? resolvedHref.slice(origin.length)
                : (resolvedHref.startsWith('/') ? resolvedHref : null);

              if (path) {
                const orderMatch = path.match(/^\/orders\/(\d+)/);
                const serviceMatch = path.match(/^\/service\/(\d+)/);
                const requestMatch = path.match(/^\/request\/(\d+)/);
                const userMatch = path.match(/^\/([a-zA-Z][a-zA-Z0-9_]{1,49})(?:\/|$|\?)/);

                if (orderMatch) {
                  return (
                    <a
                      href={resolvedHref}
                      onClick={(e) => { e.preventDefault(); navigate(`/orders/${orderMatch[1]}`); }}
                      style={{ color: '#b45309', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  );
                }
                if (serviceMatch) {
                  return (
                    <a
                      href={resolvedHref}
                      onClick={(e) => { e.preventDefault(); navigate(`/service/${serviceMatch[1]}`); }}
                      style={{ color: '#b45309', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  );
                }
                if (requestMatch) {
                  return (
                    <a
                      href={resolvedHref}
                      onClick={(e) => { e.preventDefault(); navigate(`/request/${requestMatch[1]}`); }}
                      style={{ color: '#b45309', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  );
                }
                if (userMatch && !['service', 'request', 'discover', 'login', 'signup', 'settings', 'dashboard', 'messages', 'orders', 'book', 'shop', 'search', 'leaderboard', 'verify', 'onboarding', 'profile', 'post-service', 'post-request', 'forgot-password', 'buzz-score', 'design-system', 'edit-service', 'service-published', 'request-published', 'notifications'].includes(userMatch[1])) {
                  return (
                    <a
                      href={resolvedHref}
                      onClick={(e) => { e.preventDefault(); navigate(`/${userMatch[1]}`); }}
                      style={{ color: '#b45309', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  );
                }
              }

              return (
                <a href={resolvedHref} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
                  {children}
                </a>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );

    return { content, previews };
  }

  // Determine what's showing in the chat header
  const chatUser = selectedConvo
    ? selectedConvo.other_user
    : newChatUser
    ? { name: newChatUser.name, username: newChatUser.username, online: false, profile_image: newChatUser.profile_image }
    : null;

  // Find the index of the last sent message that has been read by the other user
  const lastSeenIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === user?.id && messages[i].read_at !== null) {
        return i;
      }
    }
    return -1;
  })();

  const isChatActive = selectedConvo || newChatUser;
  const viewerName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  const otherParticipantName = selectedConvo?.other_user.name ?? newChatUser?.name ?? '';
  const pendingAttachmentBytes = pendingAttachments.reduce((sum, attachment) => sum + attachment.sizeBytes, 0);
  const pendingAttachmentSummary = pendingAttachments.length === 1
    ? '1 attachment ready'
    : `${pendingAttachments.length} attachments ready`;

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-12 md:pb-8">
        <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-8">
          Messages
        </h1>

        <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden h-[600px] md:h-[680px] lg:h-[760px] xl:h-[820px] 2xl:h-[860px] min-h-0 flex">
          {/* Conversations List - Hidden on mobile when chat is open */}
          <div className={`w-full md:w-80 md:border-r border-charcoal-100 min-h-0 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-4 border-b border-charcoal-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-cream-50 border border-charcoal-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-honey-500"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {convoLoading ? (
                <div className="space-y-1 p-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="size-10 rounded-full bg-charcoal-100 animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-48 bg-charcoal-100 rounded animate-pulse" />
                      </div>
                      <div className="h-3 w-8 bg-charcoal-100 rounded animate-pulse ml-auto shrink-0" />
                    </div>
                  ))}
                </div>
              ) : convoError ? (
                <div className="p-4 text-center text-sm text-red-600">{convoError}</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-charcoal-500">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 border-b border-charcoal-100 hover:bg-cream-50 transition-colors text-left ${
                      selectedConvo?.conversation_id === conv.conversation_id ? 'bg-cream-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="relative cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/${conv.other_user.username}`);
                        }}
                      >
                        <Avatar name={conv.other_user.name} size="md" frame={conv.other_user.cosmetics?.frame ?? null} src={conv.other_user.profile_image} />
                        {conv.other_user.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="font-sans font-bold text-charcoal-900 truncate cursor-pointer hover:text-honey-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${conv.other_user.username}`);
                            }}
                          >
                            {conv.other_user.name}
                          </span>
                          <span className="font-mono text-xs text-charcoal-400 ml-2 shrink-0">
                            {formatConversationTimestamp(conv.last_message_at)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-charcoal-900 font-medium' : 'text-charcoal-600'}`}>
                          {sanitizeContent(conv.last_message)}
                        </p>
                        {conv.context_title && (
                          <p
                            className="text-xs text-charcoal-400 truncate mt-0.5 hover:text-honey-600 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const path = conv.context_type === 'order' ? `/orders/${conv.context_id}`
                                : conv.context_type === 'service' ? `/service/${conv.context_id}`
                                : conv.context_type === 'request' ? `/request/${conv.context_id}`
                                : null;
                              if (path) navigate(path);
                            }}
                          >
                            {conv.context_type === 'order' ? `Order #${conv.context_id} — ` : ''}
                            {conv.context_title}
                          </p>
                        )}
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="size-2 bg-honey-500 rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area - Hidden on mobile when chat list is open */}
          <div className={`w-full md:flex-1 min-h-0 overflow-hidden flex flex-col ${showChat ? 'flex' : 'hidden md:flex'}`}>
            {isChatActive && chatUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-charcoal-100 flex items-center gap-3">
                  {/* Back button - Only visible on mobile */}
                  <button
                    onClick={handleBackToList}
                    className="md:hidden size-10 flex items-center justify-center hover:bg-cream-50 rounded-lg transition-colors -ml-2"
                  >
                    <ArrowLeft className="size-5 text-charcoal-600" />
                  </button>

                  <div
                    className="relative cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const uname = selectedConvo?.other_user.username ?? newChatUser?.username;
                      if (uname) navigate(`/${uname}`);
                    }}
                  >
                    <Avatar name={chatUser.name} size="md" frame={selectedConvo?.other_user.cosmetics?.frame ?? null} src={chatUser.profile_image} />
                    {chatUser.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h2
                      className="font-sans font-bold text-charcoal-900 cursor-pointer hover:text-honey-600 transition-colors"
                      onClick={() => {
                        const uname = selectedConvo?.other_user.username ?? newChatUser?.username;
                        if (uname) navigate(`/${uname}`);
                      }}
                    >
                      {chatUser.name}
                    </h2>
                    <p className="text-sm text-charcoal-600">
                      {chatUser.online ? 'Online now' : `@${chatUser.username}`}
                    </p>
                  </div>
                </div>

                {/* Context banner (service, order, or request) */}
                {activeContext && dismissedContextKey !== activeContextKey && (
                  <div className="w-full px-4 py-2.5 bg-cream-50 border-b border-charcoal-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const path = activeContext.type === 'order' ? `/orders/${activeContext.id}`
                          : activeContext.type === 'service' ? `/service/${activeContext.id}`
                          : activeContext.type === 'request' ? `/request/${activeContext.id}`
                          : null;
                        if (path) navigate(path);
                      }}
                      className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-70 transition-opacity text-left"
                    >
                      <FileText className="size-4 text-charcoal-500 shrink-0" />
                      <span className="text-sm text-charcoal-700 truncate">
                        Re:{' '}
                        {activeContext.type === 'order' && (
                          <span className="font-medium text-honey-700">Order #{activeContext.id} &mdash; </span>
                        )}
                        <span className="font-medium text-honey-700 hover:underline">{activeContext.title}</span>
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (activeContextKey) setDismissedContextKey(activeContextKey);
                      }}
                      className="shrink-0 p-1 rounded hover:bg-charcoal-100 transition-colors"
                    >
                      <X className="size-3.5 text-charcoal-400" />
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 space-y-4">
                  {msgLoading ? (
                    <div className="flex flex-col h-full">
                      {/* Header bar skeleton */}
                      <div className="h-14 bg-white border-b border-charcoal-100 mb-4" />
                      {/* Message bubbles skeleton */}
                      <div className="flex-1 px-2">
                        <div className="max-w-[60%] mb-3">
                          <div className="h-10 w-48 rounded-2xl rounded-bl-md bg-charcoal-100 animate-pulse" />
                        </div>
                        <div className="max-w-[50%] ml-auto mb-3">
                          <div className="h-10 w-36 rounded-2xl rounded-br-md bg-charcoal-100 animate-pulse ml-auto" />
                        </div>
                        <div className="max-w-[60%] mb-3">
                          <div className="h-10 w-56 rounded-2xl rounded-bl-md bg-charcoal-100 animate-pulse" />
                        </div>
                        <div className="max-w-[50%] ml-auto mb-3">
                          <div className="h-10 w-32 rounded-2xl rounded-br-md bg-charcoal-100 animate-pulse ml-auto" />
                        </div>
                      </div>
                      {/* Input bar skeleton */}
                      <div className="h-12 rounded-lg bg-charcoal-100 animate-pulse mt-auto" />
                    </div>
                  ) : msgError ? (
                    <div className="flex items-center justify-center h-full text-sm text-red-600">
                      {msgError}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <p className="text-sm text-charcoal-500">
                        {newChatUser
                          ? `Start a conversation with ${newChatUser.name}`
                          : 'No messages yet. Say hello!'}
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const orderEvent = parseOrderEventMessage(message.body);
                      const isMine = message.sender_id === user?.id;
                      const hasBody = message.body.trim() !== '';
                      const messageDate = parseUTC(message.created_at).toLocaleDateString();
                      const prevDate = index > 0 ? parseUTC(messages[index - 1].created_at).toLocaleDateString() : null;
                      const showDateSeparator = messageDate !== prevDate;
                      return (
                        <Fragment key={message.id}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-3">
                              <div className="bg-charcoal-100 text-charcoal-500 text-xs font-medium px-3 py-1 rounded-full">
                                {formatDateLabel(message.created_at)}
                              </div>
                            </div>
                          )}
                          {orderEvent ? (
                            <div className="flex justify-center">
                              <div className="w-full max-w-2xl">
                                <OrderEventMessageCard
                                  event={orderEvent}
                                  onOpen={() => navigate(`/orders/${orderEvent.orderId}`)}
                                  senderId={message.sender_id}
                                  viewerId={user?.id ?? null}
                                  viewerName={viewerName}
                                  otherUserName={otherParticipantName}
                                />
                                <div className="mt-2 text-center text-xs text-charcoal-400">
                                  {formatTimestamp(message.created_at)}
                                  {isMine && index === lastSeenIndex && (
                                    <span style={{ marginLeft: '4px', letterSpacing: '-0.5px' }}>· Read</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                                {!isMine && (
                                  <div className="text-xs text-charcoal-500 mb-1 ml-1">
                                    {message.sender?.first_name ?? ''}
                                  </div>
                                )}
                                {(() => {
                                  const { content, previews } = renderMessageBody(message.body);
                                  return (
                                    <>
                                      {message.attachments.length > 0 && (
                                        <MessageAttachmentGrid attachments={message.attachments} isMine={isMine} />
                                      )}
                                      {hasBody && (
                                        <div
                                          className={`rounded-2xl px-4 py-2 ${
                                            isMine
                                              ? 'bg-honey-500 text-charcoal-900'
                                              : 'bg-charcoal-100 text-charcoal-900'
                                          }`}
                                          style={{ overflowWrap: 'break-word', wordBreak: 'break-word', width: 'fit-content', ...(isMine ? { marginLeft: 'auto' } : {}) }}
                                        >
                                          {content}
                                        </div>
                                      )}
                                      {previews.length > 0 && (
                                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, ...(isMine ? { marginLeft: 'auto' } : {}) }}>
                                          {previews.map((p, pi) => (
                                            <LinkPreviewCard key={`${p.type}-${pi}`} {...p} />
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                                <div className={`text-xs text-charcoal-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                  {formatTimestamp(message.created_at)}
                                  {isMine && index === lastSeenIndex && (
                                    <span style={{ marginLeft: '4px', letterSpacing: '-0.5px' }}>· Read</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="shrink-0 p-4 border-t border-charcoal-100">
                  {pendingAttachments.length > 0 && (
                    <div
                      className="mb-3 rounded-[28px] p-[1px]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(245,238,225,0.96) 52%, rgba(248,230,188,0.92) 100%)',
                        boxShadow: '0 24px 48px -30px rgba(28, 28, 28, 0.24)',
                      }}
                    >
                      <div className="relative overflow-hidden rounded-[27px] border border-white/75 bg-cream-50/95 px-3 py-3 backdrop-blur-md">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 to-transparent" />
                        <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-honey-700">Attachments</p>
                            <p className="mt-1 text-sm font-semibold text-charcoal-900">
                              {pendingAttachmentSummary}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-white/70 bg-white/78 px-3 py-1 text-[11px] font-mono text-charcoal-600 shadow-sm">
                              {formatFileSize(pendingAttachmentBytes)}
                            </span>
                            <button
                              type="button"
                              onClick={clearPendingAttachments}
                              className="inline-flex items-center rounded-full border border-white/70 bg-white/82 px-3 py-1.5 text-xs font-medium text-charcoal-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"
                            >
                              Clear all
                            </button>
                          </div>
                        </div>
                        <div className="relative max-h-[198px] overflow-y-auto pr-1 scrollbar-hide">
                          <div className="space-y-2">
                            {pendingAttachments.map((attachment) => {
                              return (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-3 overflow-hidden rounded-[20px] border border-white/70 bg-white/80 px-2.5 py-2.5 backdrop-blur-sm shadow-[0_14px_22px_-24px_rgba(28,28,28,0.24)]"
                                >
                                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[14px] border border-white/70 bg-gradient-to-br from-white/70 via-cream-50/90 to-white/45 text-charcoal-700 shadow-sm">
                                    {attachment.kind === 'image' ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                                      {describePendingAttachment(attachment)}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-semibold text-charcoal-900" title={attachment.name}>
                                      {attachment.name}
                                    </p>
                                    <p className="mt-1 text-xs text-charcoal-500">{formatFileSize(attachment.sizeBytes)}</p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removePendingAttachment(attachment.id)}
                                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/75 bg-white/88 text-charcoal-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:text-charcoal-900"
                                    aria-label={`Remove ${attachment.name}`}
                                    title={`Remove ${attachment.name}`}
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    accept={CHAT_ATTACHMENT_ACCEPT}
                    onChange={handleAttachmentSelect}
                    className="hidden"
                  />
                  <div
                    className="rounded-[40px] p-[1px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(239,232,219,0.9) 54%, rgba(248,234,203,0.9) 100%)',
                      boxShadow: '0 28px 58px -44px rgba(28, 28, 28, 0.34)',
                    }}
                  >
                    <div className="relative overflow-hidden rounded-[39px] border border-white/70 bg-cream-50/82 px-4 py-3 backdrop-blur-md">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/55 to-transparent" />
                      <div className="relative flex items-end gap-3">
                        <button
                          type="button"
                          onClick={() => attachmentInputRef.current?.click()}
                          className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-white/82 bg-white/88 text-charcoal-700 shadow-[0_18px_30px_-22px_rgba(28,28,28,0.4)] transition-all hover:-translate-y-0.5 hover:border-honey-200 hover:bg-honey-50"
                          aria-label="Add files or photos"
                          title="Add files or photos"
                        >
                          <Paperclip className="size-4.5" />
                        </button>

                        <div className="min-w-0 flex-1 rounded-[30px] bg-white/72 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_34px_-30px_rgba(28,28,28,0.28)] backdrop-blur-sm transition-all focus-within:bg-white/86 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_0_0_3px_rgba(233,160,32,0.12),0_22px_34px_-30px_rgba(28,28,28,0.32)]">
                          <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            maxLength={5000}
                            className="w-full bg-transparent text-[15px] leading-7 text-charcoal-900 placeholder:text-charcoal-400 resize-none focus:outline-none"
                          />
                          <CharacterLimitHint current={messageText.length} max={5000} showWhenCurrentAtLeast={4500} className="mt-2" />
                        </div>

                        <button
                          onClick={handleSendMessage}
                          disabled={(!messageText.trim() && pendingAttachments.length === 0) || sending}
                          className="size-12 shrink-0 rounded-full bg-gradient-to-br from-honey-400 via-honey-500 to-honey-600 text-charcoal-900 flex items-center justify-center shadow-[0_18px_30px_-22px_rgba(183,121,31,0.55)] transition-all hover:-translate-y-0.5 hover:from-honey-500 hover:to-honey-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sending ? (
                            <Loader2 className="size-5 animate-spin" />
                          ) : (
                            <Send className="size-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-charcoal-500">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
