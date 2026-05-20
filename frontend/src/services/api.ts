import type { Conversation, Message, User } from '../types';
import {
  mapApiConversation,
  mapApiConversationSummary,
  mapApiMessage,
  mapApiMessages,
  mapApiUser,
  type ApiConversation,
  type ApiConversationSummary,
  type ApiUser,
  type ConversationSummary,
} from './mappers';

/** Empty string uses Vite dev proxy (see vite.config.ts); override with VITE_API_URL if needed. */
const BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export interface CreateUserPayload {
  username: string;
  userBio?: string;
  email?: string;
}

export const api = {
  /** GET /users */
  async getAllUsers(): Promise<User[]> {
    const data = await request<ApiUser[]>('/users');
    return (data ?? []).map(mapApiUser);
  },

  /** GET /users/{userId} */
  async getUser(userId: string): Promise<User> {
    const data = await request<ApiUser>(`/users/${userId}`);
    return mapApiUser(data);
  },

  /** POST /users */
  async createUser(payload: CreateUserPayload): Promise<User> {
    const data = await request<ApiUser>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapApiUser(data);
  },

  /** DELETE /users/{userId} */
  async deleteUser(userId: string): Promise<void> {
    await request<void>(`/users/${userId}`, { method: 'DELETE' });
  },

  /** POST /conversations */
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    const data = await request<ApiConversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ user1Id, user2Id }),
    });
    return mapApiConversation(data);
  },

  /** GET /conversations/user/{userId} */
  async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    const data = await request<ApiConversationSummary[]>(`/conversations/user/${userId}`);
    return (data ?? []).map(mapApiConversationSummary);
  },

  /** GET /conversations/{conversationId} */
  async getConversation(conversationId: string): Promise<Conversation> {
    const data = await request<ApiConversation>(`/conversations/${conversationId}`);
    return mapApiConversation(data);
  },

  /** GET /messages/{conversationId} */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const data = await request<unknown>(`/messages/${conversationId}`);
      return mapApiMessages(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return [];
      throw e;
    }
  },
};

/** Map a STOMP payload (may use UUID objects) to a Message. */
export function mapStompMessage(raw: Record<string, unknown>): Message {
  return mapApiMessage({
    msgId: String(raw.msgId ?? ''),
    conversationId: String(raw.conversationId ?? ''),
    senderId: String(raw.senderId ?? ''),
    content: String(raw.content ?? ''),
    status: raw.status != null ? String(raw.status) : 'SENT',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    replyToMsgId: raw.replyToMsgId as string | null | undefined,
    replyPreview: raw.replyPreview as string | null | undefined,
    replySenderId: raw.replySenderId as string | null | undefined,
  });
}
