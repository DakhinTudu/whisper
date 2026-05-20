package com.secret.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ChatMessageRequest {
    private UUID senderId;
    private UUID conversationId;
    private String content;
    private UUID replyToMsgId;
}
