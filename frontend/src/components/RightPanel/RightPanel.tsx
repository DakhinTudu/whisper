import type { User } from '../../types';
import { ProfilePanel } from '../ProfilePanel/ProfilePanel';
import { getGradientByIndex, getGradientForId } from '../../utils/avatar';
import { loadProfileExtras } from '../../utils/profile';
import { getUserBio } from '../../utils/userDisplay';

interface RightPanelProps {
  user: User | null;
  currentUser: User | null;
  showOwnProfile: boolean;
  currentUserId: string | null;
  messageCount: number;
  onDeleteAccount: () => void;
}

export function RightPanel({
  user,
  currentUser,
  showOwnProfile,
  currentUserId,
  messageCount,
  onDeleteAccount,
}: RightPanelProps) {
  if (showOwnProfile && currentUser) {
    return (
      <aside className="right-panel">
        <ProfilePanel user={currentUser} onDelete={onDeleteAccount} />
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="right-panel">
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 'var(--font-sm)',
            paddingTop: 40,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>👤</div>
          <div>Select a user to see details</div>
        </div>
      </aside>
    );
  }

  const isYou = currentUserId === user.userId;
  const extras = isYou ? loadProfileExtras() : null;
  const gradient =
    isYou && extras ? getGradientByIndex(extras.avatarIndex) : getGradientForId(user.userId);
  const bio = getUserBio(user, isYou);
  const isOnline = user.status === 'ONLINE' || user.status === 'TYPING';
  const lastActive = user.lastActiveAt
    ? new Date(user.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <aside className="right-panel">
      <div
        className="rp-avatar"
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      >
        {user.username.charAt(0).toUpperCase()}
        {isOnline && <span className="online-dot" />}
      </div>
      <div className="rp-name">{user.username}</div>
      <div className="rp-bio">{bio}</div>
      <div className="rp-info-row">🟢 {isOnline ? 'Online now' : 'Offline'}</div>
      <div className="rp-info-row">🕐 Last active: {lastActive}</div>
      <div className="rp-info-row">💬 {messageCount} messages</div>
    </aside>
  );
}
