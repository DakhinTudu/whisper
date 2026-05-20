package com.secret.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Messages {
    private UUID msgId;
    private String content;
    private UUID senderId;
    private UUID conversationId;
    private Instant createdAt;
    private MessageStatus status;
    /** Message being replied to (same conversation). */
    private UUID replyToMsgId;
    /** Snippet of the quoted message for display. */
    private String replyPreview;
    /** Sender of the quoted message. */
    private UUID replySenderId;

}
