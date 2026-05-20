/**
 * Client-side delivery/read receipts (sent → delivered → seen).
 * Disabled for now — re-enable when the backend exposes message status updates.
 */

// export type ClientMessageStatus = 'sent' | 'delivered' | 'seen';
//
// export function normalizeStatus(status: string): ClientMessageStatus {
//   const s = status.toLowerCase();
//   if (s === 'seen') return 'seen';
//   if (s === 'delivered') return 'delivered';
//   return 'sent';
// }
//
// export function statusTicks(status: ClientMessageStatus): string {
//   return status === 'sent' ? '✓' : '✓✓';
// }
