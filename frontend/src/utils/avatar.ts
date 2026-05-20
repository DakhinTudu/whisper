export const AVATAR_GRADIENTS: [string, string][] = [
  ['#f43f5e', '#e11d48'],
  ['#f97316', '#ea580c'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#06b6d4', '#0891b2'],
  ['#3b82f6', '#2563eb'],
  ['#6366f1', '#4f46e5'],
  ['#8b5cf6', '#7c3aed'],
  ['#a855f7', '#9333ea'],
  ['#ec4899', '#db2777'],
  ['#14b8a6', '#0d9488'],
  ['#ef4444', '#dc2626'],
  ['#84cc16', '#65a30d'],
  ['#22d3ee', '#06b6d4'],
  ['#f472b6', '#ec4899'],
  ['#818cf8', '#6366f1'],
];

const ADJECTIVES = [
  'Shadow', 'Neon', 'Cyber', 'Pixel', 'Frost', 'Ghost', 'Phantom', 'Digital', 'Cosmic',
  'Turbo', 'Hyper', 'Quantum', 'Zero', 'Void', 'Nova', 'Crystal', 'Solar', 'Lunar', 'Astro', 'Echo',
];
const NOUNS = [
  'Wolf', 'Fox', 'Hawk', 'Bear', 'Lynx', 'Tiger', 'Eagle', 'Raven', 'Cobra', 'Viper', 'Phoenix',
  'Dragon', 'Knight', 'Ninja', 'Sage', 'Pixel', 'Byte', 'Flux', 'Drift', 'Spark',
];

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateUsername(): string {
  return randomFrom(ADJECTIVES) + randomFrom(NOUNS);
}

export const DEFAULT_BIOS = [
  'Just chilling...',
  'Open to chat! ✌️',
  'Working on something cool',
  'Coffee & code ☕',
  'Here for good vibes',
  'Night owl 🦉',
  "Let's talk about anything",
  'Music lover 🎵',
  'Exploring the digital world',
  'Bored, say hi!',
  'Deep conversations welcome',
  'Casual chatter',
  'New here, be nice :)',
  'Gamer at heart 🎮',
  'Always online',
];

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function getGradientForId(id: string): [string, string] {
  return AVATAR_GRADIENTS[Math.abs(hashString(id)) % AVATAR_GRADIENTS.length];
}

export function getGradientByIndex(index: number): [string, string] {
  return AVATAR_GRADIENTS[((index % AVATAR_GRADIENTS.length) + AVATAR_GRADIENTS.length) % AVATAR_GRADIENTS.length];
}

export function getBioForId(id: string): string {
  return DEFAULT_BIOS[Math.abs(hashString(id)) % DEFAULT_BIOS.length];
}

export function getInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export function gradientCss(gradient: [string, string]): { background: string } {
  return { background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` };
}
