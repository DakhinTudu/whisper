package com.secret.controller;

import com.secret.dto.ConversationSummaryDto;
import com.secret.entity.Conversations;
import com.secret.entity.Messages;
import com.secret.repository.ConversationRepository;
import com.secret.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @PostMapping
    public ResponseEntity<Conversations> create(@RequestBody Conversations conversation){
        // First check if one exists
        Conversations existing = conversationRepository.findByUserIds(conversation.getUser1Id(), conversation.getUser2Id());
        if (existing != null) {
            return ResponseEntity.ok(existing);
        }
        
        conversation.setConversationId(UUID.randomUUID());
        conversationRepository.save(conversation);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationSummaryDto>> listForUser(@PathVariable UUID userId) {
        List<ConversationSummaryDto> summaries = conversationRepository.findByUserId(userId).stream()
                .map(conv -> toSummary(conv, userId))
                .sorted(Comparator.comparing(
                        ConversationSummaryDto::getLastMessageAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(summaries);
    }

    private ConversationSummaryDto toSummary(Conversations conv, UUID currentUserId) {
        UUID otherUserId = conv.getUser1Id().equals(currentUserId)
                ? conv.getUser2Id()
                : conv.getUser1Id();
        Messages last = messageRepository.findLastMessage(conv.getConversationId());
        long count = messageRepository.countMessages(conv.getConversationId());

        ConversationSummaryDto dto = new ConversationSummaryDto();
        dto.setConversationId(conv.getConversationId());
        dto.setOtherUserId(otherUserId);
        dto.setMessageCount(count);
        if (last != null) {
            dto.setLastMessagePreview(last.getContent());
            dto.setLastSenderId(last.getSenderId());
            dto.setLastMessageAt(last.getCreatedAt());
        }
        return dto;
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<Conversations> get(
            @PathVariable UUID conversationId
    ) {

        Conversations conversation =
                conversationRepository.findById(
                        conversationId
                );

        if(conversation == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(conversation);
    }
}
