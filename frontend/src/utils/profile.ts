const STORAGE_BIO = 'chat_bio';
const STORAGE_AVATAR = 'chat_avatar_index';

export function loadProfileExtras(): { bio: string; avatarIndex: number } {
  const bio = localStorage.getItem(STORAGE_BIO) ?? '';
  const raw = localStorage.getItem(STORAGE_AVATAR);
  const avatarIndex = raw != null ? parseInt(raw, 10) : 0;
  return { bio, avatarIndex: Number.isNaN(avatarIndex) ? 0 : avatarIndex };
}

export function saveProfileExtras(bio: string, avatarIndex: number): void {
  localStorage.setItem(STORAGE_BIO, bio);
  localStorage.setItem(STORAGE_AVATAR, String(avatarIndex));
}

export function clearProfileExtras(): void {
  localStorage.removeItem(STORAGE_BIO);
  localStorage.removeItem(STORAGE_AVATAR);
}
