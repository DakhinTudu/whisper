import type { User } from '../../types';
import { WhisperAvatar } from '../WhisperAvatar/WhisperAvatar';
import { getGradientByIndex } from '../../utils/avatar';
import { loadProfileExtras } from '../../utils/profile';
import { getUserBio } from '../../utils/userDisplay';
import './ProfilePanel.css';

interface ProfilePanelProps {
  user: User;
  onDelete: () => void;
  onClose?: () => void;
  /** Use in main column on mobile (right panel hidden). */
  embedded?: boolean;
}

export function ProfilePanel({ user, onDelete, onClose, embedded = false }: ProfilePanelProps) {
  const extras = loadProfileExtras();
  const gradient = getGradientByIndex(extras.avatarIndex);
  const bio = getUserBio(user, true);

  const handleDelete = () => {
    if (
      window.confirm(
        'Delete your account permanently? You will be removed from the chat and must join again to return.'
      )
    ) {
      onDelete();
    }
  };

  return (
    <div className={`profile-panel${embedded ? ' profile-panel--embedded' : ''}`}>
      {embedded && onClose && (
        <button type="button" className="profile-panel__back" onClick={onClose}>
          ← Back
        </button>
      )}

      <div className="profile-panel__header">
        <WhisperAvatar
          name={user.username}
          gradient={gradient}
          className="avatar-large"
          isOnline={user.status === 'ONLINE' || user.status === 'TYPING'}
        />
        <h2 className="profile-panel__title">Your Profile</h2>
      </div>

      <div className="profile-panel__fields">
        <div className="profile-field">
          <span className="profile-field__label">Username</span>
          <span className="profile-field__value">{user.username}</span>
        </div>

        <div className="profile-field">
          <span className="profile-field__label">User ID</span>
          <span className="profile-field__value profile-field__value--id">{user.userId}</span>
        </div>

        <div className="profile-field">
          <span className="profile-field__label">Bio</span>
          <span className="profile-field__value">{bio || '—'}</span>
        </div>

        <div className="profile-field">
          <span className="profile-field__label">Status</span>
          <span className="profile-field__value">
            {user.status === 'ONLINE' || user.status === 'TYPING' ? '🟢 Online' : 'Offline'}
          </span>
        </div>
      </div>

      <button type="button" className="profile-panel__delete" onClick={handleDelete}>
        Delete account
      </button>
    </div>
  );
}
