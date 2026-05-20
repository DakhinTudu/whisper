package com.secret.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConversationSummaryDto {
    private UUID conversationId;
    private UUID otherUserId;
    private String lastMessagePreview;
    private UUID lastSenderId;
    private Instant lastMessageAt;
    private long messageCount;
}
