import type { User } from '../../types';
import { WhisperAvatar } from '../WhisperAvatar/WhisperAvatar';
import { getGradientByIndex, getGradientForId } from '../../utils/avatar';
import { loadProfileExtras } from '../../utils/profile';
import { getUserBio } from '../../utils/userDisplay';
import './UserCard.css';

interface UserCardProps {
  user: User;
  isYou?: boolean;
  isTyping?: boolean;
  onClick: () => void;
}

export function UserCard({ user, isYou = false, isTyping = false, onClick }: UserCardProps) {
  const extras = isYou ? loadProfileExtras() : null;
  const gradient =
    isYou && extras ? getGradientByIndex(extras.avatarIndex) : getGradientForId(user.userId);
  const bio = getUserBio(user, isYou);
  const isOnline = user.status === 'ONLINE' || user.status === 'TYPING';

  return (
    <button
      type="button"
      className={`user-tile${isYou ? ' user-tile--you' : ''}`}
      onClick={onClick}
    >
      <WhisperAvatar name={user.username} gradient={gradient} isOnline={isOnline} />
      <span className="user-tile__name">
        {user.username}
        {isYou ? ' (You)' : ''}
      </span>
      <span className="user-tile__bio">{bio}</span>
      {isTyping && (
        <div className="typing-indicator-mini" aria-label="Typing">
          <span />
          <span />
          <span />
        </div>
      )}
    </button>
  );
}
