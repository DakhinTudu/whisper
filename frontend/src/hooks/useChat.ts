import { useState, useRef, useCallback } from 'react';
import type { Message, MessageReplyTarget } from '../types';
import { api } from '../services/api';
import { ws } from '../services/websocket';
import { idsEqual } from '../utils/ids';

interface UseChatOptions {
  onIncomingMessage?: (recipientId: string, preview: string) => void;
  onConversationReady?: (conversationId: string, recipientId: string) => void;
}

export function useChat(currentUserId: string | undefined, options?: UseChatOptions) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingState = useRef<boolean | null>(null);
  const openGeneration = useRef(0);

  const openChat = useCallback(
    async (recipientId: string, recipientName: string) => {
      if (!currentUserId) return;

      const generation = ++openGeneration.current;
      setChatError(null);
      setChatReady(false);
      subRef.current?.unsubscribe();
      subRef.current = null;
      setMessages([]);
      setIsTyping(false);

      try {
        // 1. Create or reuse conversation (same as static app.js startChatWith)
        const conv = await api.getOrCreateConversation(currentUserId, recipientId);
        if (generation !== openGeneration.current) return;

        setConversationId(conv.conversationId);
        options?.onConversationReady?.(conv.conversationId, recipientId);

        // 2. STOMP connected on login in App (static: connectToWebsocket in selectSelf)
        await ws.waitUntilConnected();
        if (generation !== openGeneration.current) return;

        // 3. Subscribe then load history — same order as static/js/app.js startChatWith
        subRef.current = ws.subscribeToChat(
          conv.conversationId,
          (msg) => {
            setMessages((prev) => {
              const withoutTemp = prev.filter(
                (m) =>
                  !(
                    m.msgId.startsWith('temp-') &&
                    idsEqual(m.senderId, currentUserId) &&
                    m.content === msg.content &&
                    (m.replyToMsgId ?? '') === (msg.replyToMsgId ?? '')
                  )
              );
              if (withoutTemp.some((m) => m.msgId === msg.msgId)) return withoutTemp;
              return [...withoutTemp, msg];
            });
            if (!idsEqual(msg.senderId, currentUserId)) {
              options?.onIncomingMessage?.(recipientId, msg.content);
            }
          },
          (data) => {
            if (!idsEqual(data.senderId, currentUserId)) {
              setIsTyping(data.isTyping);
              setTypingUser(recipientName);
            }
          }
        );

        const history = await api.getMessages(conv.conversationId);
        if (generation !== openGeneration.current) return;
        setMessages(history);

        setChatReady(true);
      } catch (err) {
        console.error('Failed to open chat:', err);
        setChatError(
          err instanceof Error ? err.message : 'Could not start conversation. Is the backend running?'
        );
      }
    },
    [currentUserId, options]
  );

  const sendTypingStatus = useCallback(
    (typing: boolean) => {
      if (!conversationId || !currentUserId || !ws.isConnected()) return;
      if (lastTypingState.current === typing) return;
      lastTypingState.current = typing;
      ws.sendTyping(conversationId, currentUserId, typing);
    },
    [conversationId, currentUserId]
  );

  const sendMessage = useCallback(
    (content: string, reply?: MessageReplyTarget | null) => {
      if (!conversationId || !currentUserId || !content.trim() || !chatReady) return;
      const trimmed = content.trim();
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        msgId: tempId,
        conversationId,
        senderId: currentUserId,
        content: trimmed,
        status: 'SENT',
        createdAt: new Date().toISOString(),
        ...(reply
          ? {
              replyToMsgId: reply.msgId,
              replyPreview: reply.preview,
              replySenderId: reply.senderId,
            }
          : {}),
      };
      setMessages((prev) => [...prev, optimistic]);
      ws.sendMessage(conversationId, currentUserId, trimmed, reply?.msgId);
      sendTypingStatus(false);
    },
    [conversationId, currentUserId, chatReady, sendTypingStatus]
  );

  const handleTyping = useCallback(() => {
    sendTypingStatus(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTypingStatus(false), 2000);
  }, [sendTypingStatus]);

  const closeChat = useCallback(() => {
    openGeneration.current += 1;
    subRef.current?.unsubscribe();
    subRef.current = null;
    setConversationId(null);
    setMessages([]);
    setIsTyping(false);
    setChatError(null);
    setChatReady(false);
    lastTypingState.current = null;
  }, []);

  return {
    conversationId,
    messages,
    isTyping,
    typingUser,
    chatError,
    chatReady,
    openChat,
    sendMessage,
    handleTyping,
    closeChat,
  };
}
