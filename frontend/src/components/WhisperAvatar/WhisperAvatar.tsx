import { gradientCss, getInitial } from '../../utils/avatar';

interface WhisperAvatarProps {
  name: string;
  gradient: [string, string];
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
}

export function WhisperAvatar({
  name,
  gradient,
  className = 'avatar-large',
  showOnline = true,
  isOnline = true,
}: WhisperAvatarProps) {
  const initial = getInitial(name);
  const dotClass = className === 'avatar-large' ? 'online-dot' : 'online-dot-mini';

  return (
    <div className={className} style={gradientCss(gradient)}>
      {initial}
      {showOnline && isOnline && <span className={dotClass} />}
    </div>
  );
}
