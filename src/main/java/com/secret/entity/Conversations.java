package com.secret.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Conversations {
    private UUID conversationId;
    private UUID user1Id;
    private UUID user2Id;
    private Instant createdAt;
}
