export interface User {
  userId: string;
  username: string;
  userBio?: string;
  status: 'ONLINE' | 'OFFLINE' | 'TYPING';
  lastActiveAt?: string;
}

export interface Message {
  msgId: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: string;
  createdAt: string;
  replyToMsgId?: string;
  replyPreview?: string;
  replySenderId?: string;
}

export interface MessageReplyTarget {
  msgId: string;
  preview: string;
  senderId: string;
  senderLabel: string;
}

export interface Conversation {
  conversationId: string;
  user1Id: string;
  user2Id: string;
  createdAt?: string;
}

export interface ChatMessageRequest {
  conversationId: string;
  senderId: string;
  content: string;
  replyToMsgId?: string;
}

export interface TypingRequest {
  conversationId: string;
  senderId: string;
  isTyping: boolean;
}

export interface PresenceUpdate {
  userId: string;
  status: 'ONLINE' | 'OFFLINE' | 'TYPING';
}
