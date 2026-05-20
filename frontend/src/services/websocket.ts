import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { PresenceUpdate, Message, TypingRequest } from '../types';
import { mapStompMessage } from './api';

const WS_URL = `${import.meta.env.VITE_API_URL ?? ''}/ws`;

let stompClient: Client | null = null;
let connectPromise: Promise<void> | null = null;

type PresenceCallback = (update: PresenceUpdate) => void;
type MessageCallback = (msg: Message) => void;
type TypingCallback = (data: TypingRequest) => void;

let presenceCallback: PresenceCallback | null = null;

type ChatChannel = {
  msgSub: { unsubscribe: () => void };
  typeSub: { unsubscribe: () => void };
  messageListeners: Set<MessageCallback>;
  typingListeners: Set<TypingCallback>;
};

const chatChannels = new Map<string, ChatChannel>();

function notifyMessage(conversationId: string, msg: Message) {
  chatChannels.get(conversationId)?.messageListeners.forEach((cb) => cb(msg));
}

function notifyTyping(conversationId: string, data: TypingRequest) {
  chatChannels.get(conversationId)?.typingListeners.forEach((cb) => cb(data));
}

function ensureChatChannel(conversationId: string): ChatChannel | null {
  if (!stompClient?.connected) return null;

  let channel = chatChannels.get(conversationId);
  if (channel) return channel;

  const messageListeners = new Set<MessageCallback>();
  const typingListeners = new Set<TypingCallback>();

  const msgSub = stompClient.subscribe(`/topic/chat/${conversationId}`, (frame) => {
    const raw = JSON.parse(frame.body) as Record<string, unknown>;
    notifyMessage(conversationId, mapStompMessage(raw));
  });

  const typeSub = stompClient.subscribe(`/topic/chat/${conversationId}/typing`, (frame) => {
    const raw = JSON.parse(frame.body) as Record<string, unknown>;
    notifyTyping(conversationId, mapTyping(raw));
  });

  channel = { msgSub, typeSub, messageListeners, typingListeners };
  chatChannels.set(conversationId, channel);
  return channel;
}

function teardownChatChannel(conversationId: string) {
  const channel = chatChannels.get(conversationId);
  if (!channel) return;
  channel.msgSub.unsubscribe();
  channel.typeSub.unsubscribe();
  chatChannels.delete(conversationId);
}

function mapPresence(raw: Record<string, unknown>): PresenceUpdate {
  const status = String(raw.status ?? 'OFFLINE').toUpperCase();
  return {
    userId: String(raw.userId ?? ''),
    status: status === 'ONLINE' ? 'ONLINE' : status === 'TYPING' ? 'TYPING' : 'OFFLINE',
  };
}

function mapTyping(raw: Record<string, unknown>): TypingRequest {
  return {
    conversationId: String(raw.conversationId ?? ''),
    senderId: String(raw.senderId ?? ''),
    isTyping: Boolean(raw.isTyping),
  };
}

export const ws = {
  isConnected(): boolean {
    return Boolean(stompClient?.connected);
  },

  /** Same guarantee as static app.js: STOMP must be up before conversation subscribe/send. */
  waitUntilConnected(timeoutMs = 15000): Promise<void> {
    if (stompClient?.connected) return Promise.resolve();
    if (connectPromise) {
      return Promise.race([
        connectPromise,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('WebSocket connection timed out')), timeoutMs)
        ),
      ]);
    }
    return Promise.reject(new Error('WebSocket is not connecting — log in first'));
  },

  connect(userId: string, onPresence: PresenceCallback): Promise<void> {
    presenceCallback = onPresence;

    if (stompClient?.connected) {
      return Promise.resolve();
    }

    if (connectPromise) {
      return connectPromise;
    }

    connectPromise = new Promise((resolve, reject) => {
      stompClient = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { userId },
        debug: () => {},
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient!.subscribe('/topic/chat.status', (frame) => {
            const update = mapPresence(JSON.parse(frame.body) as Record<string, unknown>);
            presenceCallback?.(update);
          });
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP Error:', frame);
          connectPromise = null;
          reject(frame);
        },
        onWebSocketClose: () => {
          connectPromise = null;
        },
      });

      stompClient.activate();
    });

    return connectPromise;
  },

  subscribeToChat(
    conversationId: string,
    onMessage: MessageCallback,
    onTyping: TypingCallback
  ) {
    const channel = ensureChatChannel(conversationId);
    if (!channel) {
      console.error('subscribeToChat called while STOMP disconnected');
      return { unsubscribe: () => {} };
    }

    channel.messageListeners.add(onMessage);
    channel.typingListeners.add(onTyping);

    return {
      unsubscribe: () => {
        const ch = chatChannels.get(conversationId);
        if (!ch) return;
        ch.messageListeners.delete(onMessage);
        ch.typingListeners.delete(onTyping);
        if (ch.messageListeners.size === 0 && ch.typingListeners.size === 0) {
          teardownChatChannel(conversationId);
        }
      },
    };
  },

  sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToMsgId?: string
  ) {
    if (!stompClient?.connected) {
      console.error('sendMessage called while STOMP disconnected');
      return;
    }
    const body: Record<string, string> = { conversationId, senderId, content };
    if (replyToMsgId) {
      body.replyToMsgId = replyToMsgId;
    }
    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(body),
    });
  },

  sendTyping(conversationId: string, senderId: string, isTyping: boolean) {
    if (!stompClient?.connected) return;
    stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, senderId, isTyping }),
    });
  },

  disconnect() {
    chatChannels.forEach((_, id) => teardownChatChannel(id));
    stompClient?.deactivate();
    stompClient = null;
    connectPromise = null;
  },
};
