import { useEffect, useRef, useState } from 'react';
import {
  AVATAR_GRADIENTS,
  DEFAULT_BIOS,
  generateUsername,
  getInitial,
  gradientCss,
  randomFrom,
} from '../../utils/avatar';

interface JoinModalProps {
  open: boolean;
  onClose: () => void;
  onJoin: (nickname: string, bio: string, avatarIndex: number) => void;
}

export function JoinModal({ open, onClose, onJoin }: JoinModalProps) {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const nicknameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNickname(generateUsername());
    setStatus(randomFrom(DEFAULT_BIOS));
    setAvatarIndex(Math.floor(Math.random() * AVATAR_GRADIENTS.length));
    const t = setTimeout(() => nicknameRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, [open]);

  const handleSubmit = () => {
    const name = nickname.trim() || generateUsername();
    onJoin(name, status.trim() || randomFrom(DEFAULT_BIOS), avatarIndex);
  };

  return (
    <div
      className={`modal-overlay${open ? ' active' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <h2>🚀 Join Whisper</h2>
        <div className="input-group">
          <label>Choose a Nickname</label>
          <input
            ref={nicknameRef}
            type="text"
            placeholder="e.g. NeonGhost"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div className="input-group">
          <label>Pick an Avatar</label>
          <div className="avatar-picker">
            {AVATAR_GRADIENTS.map((grad, i) => (
              <button
                key={i}
                type="button"
                className={`avatar-option${i === avatarIndex ? ' selected' : ''}`}
                style={gradientCss(grad)}
                onClick={() => setAvatarIndex(i)}
              >
                {getInitial(nickname)}
              </button>
            ))}
          </div>
        </div>
        <div className="input-group">
          <label>Status Message (optional)</label>
          <input
            type="text"
            placeholder="What's on your mind?"
            maxLength={40}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <button type="button" className="btn-primary" onClick={handleSubmit}>
          Enter Anonymously →
        </button>
        <div style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          No email or password needed. Just pick a name and start chatting.
        </div>
      </div>
    </div>
  );
}
