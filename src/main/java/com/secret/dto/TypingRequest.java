package com.secret.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.UUID;

@Data
public class TypingRequest {
    private UUID conversationId;
    private UUID senderId;
    
    @JsonProperty("isTyping")
    private boolean isTyping;
}
