import { WhisperAvatar } from '../WhisperAvatar/WhisperAvatar';
import { getGradientForId } from '../../utils/avatar';

export interface ChatSessionItem {
  userId: string;
  username: string;
  preview: string;
  unread: number;
  isOnline?: boolean;
  conversationId?: string;
  lastMessageAt?: string;
}

interface SidebarProps {
  open: boolean;
  loggedIn: boolean;
  sessions: ChatSessionItem[];
  activeChatUserId: string | null;
  onSelectChat: (userId: string) => void;
}

export function Sidebar({
  open,
  loggedIn,
  sessions,
  activeChatUserId,
  onSelectChat,
}: SidebarProps) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">💬</div>
        <span className="logo-text">Incoginato</span>
      </div>

      {loggedIn && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Chats</div>
        </div>
      )}

      <div className="active-chats-list">
        {!loggedIn ? null : sessions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', padding: '8px 12px' }}>
            No conversations yet — start chatting from the feed
          </div>
        ) : (
          sessions.map((s) => {
            const gradient = getGradientForId(s.userId);
            return (
              <div
                key={s.userId}
                className={`chat-list-item${activeChatUserId === s.userId ? ' active' : ''}`}
                onClick={() => onSelectChat(s.userId)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectChat(s.userId)}
                role="button"
                tabIndex={0}
              >
                <WhisperAvatar
                  name={s.username}
                  gradient={gradient}
                  className="avatar-circle"
                  isOnline={s.isOnline !== false}
                />
                <div className="chat-list-item-info">
                  <div className="chat-list-item-name">{s.username}</div>
                  <div className="chat-list-item-preview">{s.preview || 'Tap to chat'}</div>
                </div>
                {s.unread > 0 && <div className="unread-badge">{s.unread}</div>}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
