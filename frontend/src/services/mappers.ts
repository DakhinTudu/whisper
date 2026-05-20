import type { Conversation, Message, User } from '../types';

type ApiUserStatus = 'ONLINE' | 'OFFLINE' | 'TYPING' | string;

export interface ApiUser {
  userId: string;
  username: string;
  userBio?: string | null;
  email?: string | null;
  status?: ApiUserStatus | null;
  lastActiveAt?: string | null;
}

export interface ApiMessage {
  msgId: string;
  conversationId: string;
  senderId: string;
  content: string;
  status?: string | null;
  createdAt: string;
  replyToMsgId?: string | null;
  replyPreview?: string | null;
  replySenderId?: string | null;
}

export interface ApiConversation {
  conversationId: string;
  user1Id: string;
  user2Id: string;
  createdAt?: string | null;
}

export interface ApiConversationSummary {
  conversationId: string;
  otherUserId: string;
  lastMessagePreview?: string | null;
  lastSenderId?: string | null;
  lastMessageAt?: string | null;
  messageCount?: number;
}

function toId(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function mapStatus(status?: ApiUserStatus | null): User['status'] {
  const s = (status ?? 'OFFLINE').toString().toUpperCase();
  if (s === 'ONLINE' || s === 'TYPING' || s === 'OFFLINE') return s;
  return 'OFFLINE';
}

export function mapApiUser(raw: ApiUser): User {
  return {
    userId: toId(raw.userId),
    username: raw.username ?? 'Anonymous',
    userBio: raw.userBio ?? undefined,
    status: mapStatus(raw.status),
    lastActiveAt: raw.lastActiveAt ?? undefined,
  };
}

function mapReplyFields(raw: {
  replyToMsgId?: unknown;
  replyPreview?: unknown;
  replySenderId?: unknown;
}): Pick<Message, 'replyToMsgId' | 'replyPreview' | 'replySenderId'> {
  const reply: Pick<Message, 'replyToMsgId' | 'replyPreview' | 'replySenderId'> = {};
  if (raw.replyToMsgId != null && raw.replyToMsgId !== '') {
    reply.replyToMsgId = toId(raw.replyToMsgId);
  }
  if (raw.replyPreview != null && String(raw.replyPreview).trim() !== '') {
    reply.replyPreview = String(raw.replyPreview);
  }
  if (raw.replySenderId != null && raw.replySenderId !== '') {
    reply.replySenderId = toId(raw.replySenderId);
  }
  return reply;
}

export function mapApiMessage(raw: ApiMessage): Message {
  return {
    msgId: toId(raw.msgId),
    conversationId: toId(raw.conversationId),
    senderId: toId(raw.senderId),
    content: raw.content ?? '',
    status: raw.status?.toString() ?? 'SENT',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    ...mapReplyFields(raw),
  };
}

export interface ConversationSummary {
  conversationId: string;
  otherUserId: string;
  lastMessagePreview?: string;
  lastSenderId?: string;
  lastMessageAt?: string;
  messageCount: number;
}

export function mapApiConversationSummary(raw: ApiConversationSummary): ConversationSummary {
  return {
    conversationId: toId(raw.conversationId),
    otherUserId: toId(raw.otherUserId),
    lastMessagePreview: raw.lastMessagePreview ?? undefined,
    lastSenderId: raw.lastSenderId ? toId(raw.lastSenderId) : undefined,
    lastMessageAt: raw.lastMessageAt ?? undefined,
    messageCount: raw.messageCount ?? 0,
  };
}

export function mapApiConversation(raw: ApiConversation): Conversation {
  return {
    conversationId: toId(raw.conversationId),
    user1Id: toId(raw.user1Id),
    user2Id: toId(raw.user2Id),
    createdAt: raw.createdAt ?? undefined,
  };
}

/** Backend may return a Queue as a JSON array or occasionally as an object. */
export function mapApiMessages(payload: unknown): Message[] {
  if (Array.isArray(payload)) {
    return payload.map((m) => mapApiMessage(m as ApiMessage));
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    // Java Queue serialized as { "0": msg, "1": msg } in some setups
    const numericKeys = Object.keys(obj).every((k) => /^\d+$/.test(k));
    if (numericKeys) {
      return Object.keys(obj)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => mapApiMessage(obj[k] as ApiMessage));
    }
    const values = Object.values(obj);
    if (values.length > 0 && values[0] != null && typeof values[0] === 'object') {
      return values.map((m) => mapApiMessage(m as ApiMessage));
    }
  }
  return [];
}
