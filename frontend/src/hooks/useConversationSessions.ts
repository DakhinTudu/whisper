import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatSessionItem } from '../components/Sidebar/Sidebar';
import { api } from '../services/api';
import { ws } from '../services/websocket';
import type { User } from '../types';
import { idsEqual } from '../utils/ids';

function previewFromMessage(content: string, fromMe: boolean): string {
  const text = content.trim();
  if (!text) return '';
  return fromMe ? `You: ${text}` : text;
}

function sortSessions(items: ChatSessionItem[]): ChatSessionItem[] {
  return [...items].sort((a, b) => {
    const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    if (tb !== ta) return tb - ta;
    return a.username.localeCompare(b.username);
  });
}

export function useConversationSessions(
  currentUserId: string | undefined,
  isConnected: boolean,
  activeChatUserId: string | null
) {
  const [sessions, setSessions] = useState<Record<string, ChatSessionItem>>({});
  const convToPeerRef = useRef<Record<string, string>>({});
  const inboxUnsubsRef = useRef<Array<{ unsubscribe: () => void }>>([]);
  const activeChatRef = useRef(activeChatUserId);
  activeChatRef.current = activeChatUserId;

  const clearInboxSubscriptions = useCallback(() => {
    inboxUnsubsRef.current.forEach((s) => s.unsubscribe());
    inboxUnsubsRef.current = [];
  }, []);

  const clearAll = useCallback(() => {
    clearInboxSubscriptions();
    convToPeerRef.current = {};
    setSessions({});
  }, [clearInboxSubscriptions]);

  const subscribeInbox = useCallback(
    (conversationIds: string[]) => {
      clearInboxSubscriptions();
      if (!currentUserId) return;

      for (const convId of conversationIds) {
        const sub = ws.subscribeToChat(
          convId,
          (msg) => {
            const peerId = convToPeerRef.current[convId];
            if (!peerId) return;

            const fromMe = idsEqual(msg.senderId, currentUserId);
            const preview = previewFromMessage(msg.content, fromMe);
            const isOpen = activeChatRef.current === peerId;

            setSessions((prev) => {
              const existing = prev[peerId];
              return {
                ...prev,
                [peerId]: {
                  userId: peerId,
                  username: existing?.username ?? 'User',
                  preview: preview || existing?.preview || '',
                  conversationId: convId,
                  lastMessageAt: msg.createdAt,
                  isOnline: existing?.isOnline,
                  unread:
                    isOpen || fromMe ? 0 : (existing?.unread ?? 0) + 1,
                },
              };
            });
          },
          () => {}
        );
        inboxUnsubsRef.current.push(sub);
      }
    },
    [currentUserId, clearInboxSubscriptions]
  );

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const summaries = await api.getUserConversations(currentUserId);
      const statusById = new Map<string, User['status']>();
      try {
        const all = await api.getAllUsers();
        all.forEach((u) => statusById.set(u.userId, u.status));
      } catch {
        /* ignore */
      }

      const peerIds = [...new Set(summaries.map((s) => s.otherUserId))];
      const userById = new Map<string, User>();
      await Promise.all(
        peerIds.map(async (id) => {
          try {
            userById.set(id, await api.getUser(id));
          } catch {
            userById.set(id, { userId: id, username: 'Unknown', status: 'OFFLINE' });
          }
        })
      );

      const convMap: Record<string, string> = {};
      const next: Record<string, ChatSessionItem> = {};

      for (const s of summaries) {
        const peer = userById.get(s.otherUserId);
        const username = peer?.username ?? 'Unknown';
        const status = statusById.get(s.otherUserId) ?? peer?.status ?? 'OFFLINE';
        const fromMe = s.lastSenderId ? idsEqual(s.lastSenderId, currentUserId) : false;
        const preview = s.lastMessagePreview
          ? previewFromMessage(s.lastMessagePreview, fromMe)
          : '';

        convMap[s.conversationId] = s.otherUserId;
        next[s.otherUserId] = {
          userId: s.otherUserId,
          username,
          preview,
          unread: 0,
          isOnline: status === 'ONLINE' || status === 'TYPING',
          conversationId: s.conversationId,
          lastMessageAt: s.lastMessageAt,
        };
      }

      convToPeerRef.current = convMap;

      setSessions((prev) => {
        const merged: Record<string, ChatSessionItem> = { ...next };
        for (const id of Object.keys(merged)) {
          const old = prev[id];
          if (old?.unread) {
            merged[id] = { ...merged[id], unread: old.unread };
          }
        }
        return merged;
      });

      if (isConnected) {
        try {
          await ws.waitUntilConnected();
          subscribeInbox(summaries.map((s) => s.conversationId));
        } catch {
          /* ws not ready */
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [currentUserId, isConnected, subscribeInbox]);

  useEffect(() => {
    if (!currentUserId) {
      clearAll();
      return;
    }
    loadConversations();
  }, [currentUserId, isConnected, loadConversations, clearAll]);

  useEffect(() => {
    return () => clearInboxSubscriptions();
  }, [clearInboxSubscriptions]);

  const sessionList = useMemo(() => sortSessions(Object.values(sessions)), [sessions]);

  const ensureSession = useCallback((user: User, conversationId?: string) => {
    setSessions((prev) => ({
      ...prev,
      [user.userId]: {
        userId: user.userId,
        username: user.username,
        preview: prev[user.userId]?.preview ?? '',
        unread: activeChatRef.current === user.userId ? 0 : (prev[user.userId]?.unread ?? 0),
        isOnline: user.status === 'ONLINE' || user.status === 'TYPING',
        conversationId: conversationId ?? prev[user.userId]?.conversationId,
        lastMessageAt: prev[user.userId]?.lastMessageAt,
      },
    }));
  }, []);

  const updateSessionPreview = useCallback(
    (peerId: string, preview: string, count: number, username?: string) => {
      setSessions((prev) => {
        const existing = prev[peerId];
        return {
          ...prev,
          [peerId]: {
            userId: peerId,
            username: username ?? existing?.username ?? 'User',
            preview,
            unread: 0,
            isOnline: existing?.isOnline ?? true,
            conversationId: existing?.conversationId,
            lastMessageAt: new Date().toISOString(),
          },
        };
      });
      return count;
    },
    []
  );

  const onIncomingMessage = useCallback((peerId: string, preview: string, username?: string) => {
    const isOpen = activeChatRef.current === peerId;
    setSessions((prev) => {
      const existing = prev[peerId];
      return {
        ...prev,
        [peerId]: {
          userId: peerId,
          username: username ?? existing?.username ?? 'User',
          preview,
          unread: isOpen ? 0 : (existing?.unread ?? 0) + 1,
          isOnline: existing?.isOnline ?? true,
          conversationId: existing?.conversationId,
          lastMessageAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const clearUnread = useCallback((peerId: string) => {
    setSessions((prev) => {
      if (!prev[peerId]) return prev;
      return { ...prev, [peerId]: { ...prev[peerId], unread: 0 } };
    });
  }, []);

  const registerConversation = useCallback(
    (conversationId: string, peerId: string) => {
      convToPeerRef.current[conversationId] = peerId;
      setSessions((prev) => ({
        ...prev,
        [peerId]: {
          ...(prev[peerId] ?? { userId: peerId, username: 'User', preview: '', unread: 0 }),
          conversationId,
        },
      }));
      void loadConversations();
    },
    [loadConversations]
  );

  return {
    sessions,
    sessionList,
    clearAll,
    ensureSession,
    updateSessionPreview,
    onIncomingMessage,
    clearUnread,
    registerConversation,
    refreshConversations: loadConversations,
  };
}
