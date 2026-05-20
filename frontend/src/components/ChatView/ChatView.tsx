import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import type { Message, MessageReplyTarget, User } from '../../types';
import { getGradientForId } from '../../utils/avatar';
import { idsEqual } from '../../utils/ids';
import { MessageQuote, replySenderLabel } from './MessageQuote';
import { SwipeableMessage } from './SwipeableMessage';
import './ChatView.css';

interface ChatViewProps {
  active: boolean;
  currentUserId: string;
  recipient: User | null;
  onBack: () => void;
  onMessagesChange?: (recipientId: string, preview: string, count: number) => void;
  onIncomingMessage?: (recipientId: string, preview: string) => void;
  onConversationReady?: (conversationId: string, recipientId: string) => void;
}

function buildReplyTarget(
  msg: Message,
  currentUserId: string,
  recipientName: string
): MessageReplyTarget {
  const preview = msg.content.trim().slice(0, 120);
  return {
    msgId: msg.msgId,
    preview: preview || msg.content,
    senderId: msg.senderId,
    senderLabel: replySenderLabel(msg.senderId, currentUserId, recipientName),
  };
}

export function ChatView({
  active,
  currentUserId,
  recipient,
  onBack,
  onMessagesChange,
  onIncomingMessage,
  onConversationReady,
}: ChatViewProps) {
  const {
    messages,
    isTyping,
    chatError,
    chatReady,
    openChat,
    sendMessage,
    handleTyping,
    closeChat,
  } = useChat(currentUserId, { onIncomingMessage, onConversationReady });

  const [input, setInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<MessageReplyTarget | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recipientId = recipient?.userId;
  const recipientName = recipient?.username ?? 'User';

  const gradient = recipient ? getGradientForId(recipient.userId) : ['#6366f1', '#8b5cf6'];
  const isOnline = recipient
    ? recipient.status === 'ONLINE' || recipient.status === 'TYPING'
    : false;

  const clearReply = useCallback(() => setReplyTarget(null), []);

  const startReply = useCallback(
    (msg: Message) => {
      if (!msg.msgId || msg.msgId.startsWith('temp-')) return;
      setReplyTarget(buildReplyTarget(msg, currentUserId, recipientName));
    },
    [currentUserId, recipientName]
  );

  useEffect(() => {
    if (!active || !recipientId || !recipient) return;

    openChat(recipientId, recipient.username);
    setReplyTarget(null);

    return () => {
      closeChat();
      setReplyTarget(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-open when switching recipient
  }, [active, recipientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, replyTarget]);

  useEffect(() => {
    if (!onMessagesChange || !recipient || messages.length === 0) return;
    const last = messages[messages.length - 1];
    const preview = idsEqual(last.senderId, currentUserId)
      ? `You: ${last.content}`
      : last.content;
    onMessagesChange(recipient.userId, preview, messages.length);
  }, [messages, currentUserId, recipient, onMessagesChange]);

  const handleSend = () => {
    if (!input.trim() || !chatReady) return;
    sendMessage(input, replyTarget);
    setInput('');
    setReplyTarget(null);
  };

  const statusText =
    chatError
      ? 'Connection issue'
      : isTyping && recipient
        ? 'typing...'
        : isOnline
          ? 'Online'
          : 'Offline';

  return (
    <div className={`chat-view${active ? ' active' : ''}`}>
      <div className="chat-header">
        <button type="button" className="chat-header-back" onClick={onBack}>
          ←
        </button>
        <div className="chat-header-user">
          <div
            className="chat-header-avatar"
            style={{
              background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            }}
          >
            {recipient ? recipient.username.charAt(0).toUpperCase() : ''}
            {isOnline && <span className="online-dot-mini" />}
          </div>
          <div>
            <div className="chat-header-name">{recipient?.username ?? ''}</div>
            <div className="chat-header-status">{statusText}</div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {recipient && (
          <div className="encryption-notice">
            Secure end-to-end conversation with {recipient.username}
          </div>
        )}
        {chatError && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--danger)',
              fontSize: 'var(--font-sm)',
              padding: 12,
            }}
          >
            {chatError}
          </div>
        )}
        {!chatReady && active && recipient && !chatError && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
            Connecting to chat…
          </div>
        )}
        {messages.map((msg) => {
          const sent = idsEqual(msg.senderId, currentUserId);
          const time = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const quoteLabel = msg.replySenderId
            ? replySenderLabel(msg.replySenderId, currentUserId, recipientName)
            : recipientName;

          return (
            <div
              key={msg.msgId || `${msg.createdAt}-${msg.senderId}-${msg.content}`}
              className={`message ${sent ? 'sent' : 'received'}`}
            >
              <SwipeableMessage sent={sent} onReply={() => startReply(msg)}>
                <div className="message-bubble">
                  {msg.replyToMsgId && msg.replyPreview && (
                    <MessageQuote
                      preview={msg.replyPreview}
                      senderLabel={quoteLabel}
                      sent={sent}
                    />
                  )}
                  {msg.content}
                </div>
              </SwipeableMessage>
              <div className="message-meta">
                <span>{time}</span>
              </div>
            </div>
          );
        })}
        {isTyping && recipient && (
          <div className="message received typing-message">
            <div className="message-bubble typing-bubble">
              <div className="typing-indicator-mini">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        {replyTarget && (
          <div className="reply-composer-bar">
            <div className="reply-composer-bar__body">
              <span className="reply-composer-bar__label">
                Replying to {replyTarget.senderLabel}
              </span>
              <span className="reply-composer-bar__preview">{replyTarget.preview}</span>
            </div>
            <button
              type="button"
              className="reply-composer-bar__close"
              aria-label="Cancel reply"
              onClick={clearReply}
            >
              ×
            </button>
          </div>
        )}
        <div className="chat-input-wrapper">
          <input
            type="text"
            placeholder={
              chatReady
                ? replyTarget
                  ? 'Write a reply...'
                  : 'Type a message...'
                : 'Waiting for connection...'
            }
            value={input}
            autoComplete="off"
            disabled={!active || !recipient || !chatReady}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            type="button"
            className="btn-send"
            onClick={handleSend}
            disabled={!recipient || !chatReady}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
