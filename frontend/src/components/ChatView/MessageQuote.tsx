import { idsEqual } from '../../utils/ids';

interface MessageQuoteProps {
  preview: string;
  senderLabel: string;
  sent: boolean;
}

export function MessageQuote({ preview, senderLabel, sent }: MessageQuoteProps) {
  return (
    <div className={`message-quote${sent ? ' message-quote--sent' : ''}`}>
      <span className="message-quote__author">{senderLabel}</span>
      <span className="message-quote__text">{preview}</span>
    </div>
  );
}

export function replySenderLabel(
  replySenderId: string | undefined,
  currentUserId: string,
  recipientName: string
): string {
  if (!replySenderId) return '';
  if (idsEqual(replySenderId, currentUserId)) return 'You';
  return recipientName;
}
