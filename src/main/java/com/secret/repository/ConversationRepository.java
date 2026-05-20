package com.secret.repository;

import com.secret.entity.Conversations;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class ConversationRepository {
    private final ConcurrentHashMap<UUID, Conversations> conversationDb = new ConcurrentHashMap<>();

    public void save(Conversations conversation){
        conversationDb.put(conversation.getConversationId(), conversation);
    }

    public Conversations findById(UUID conversationId){
        return conversationDb.get(conversationId);
    }

    public Collection<Conversations> findAll(){
        return conversationDb.values();
    }

    public Conversations findByUserIds(UUID u1, UUID u2) {
        return conversationDb.values().stream()
                .filter(c -> (c.getUser1Id().equals(u1) && c.getUser2Id().equals(u2)) ||
                             (c.getUser1Id().equals(u2) && c.getUser2Id().equals(u1)))
                .findFirst()
                .orElse(null);
    }

    public void delete(UUID conversationId) {
        conversationDb.remove(conversationId);
    }

    public List<Conversations> findByUserId(UUID userId) {
        return conversationDb.values().stream()
                .filter(c -> c.getUser1Id().equals(userId) || c.getUser2Id().equals(userId))
                .collect(Collectors.toList());
    }
}