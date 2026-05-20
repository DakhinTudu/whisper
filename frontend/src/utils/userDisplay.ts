import type { User } from '../types';
import { getBioForId } from './avatar';
import { loadProfileExtras } from './profile';

/** Bio from API (userBio), with local fallback for avatar-only profile extras. */
export function getUserBio(user: User, isYou = false): string {
  if (user.userBio?.trim()) return user.userBio.trim();
  if (isYou) {
    const extras = loadProfileExtras();
    if (extras.bio.trim()) return extras.bio.trim();
  }
  return getBioForId(user.userId);
}
