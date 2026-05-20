package com.secret.repository;

import com.secret.entity.Messages;
import org.springframework.stereotype.Repository;

import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.springframework.lang.Nullable;
@Repository
public class MessageRepository {
    private final ConcurrentHashMap<UUID, ConcurrentLinkedQueue<Messages>> messageDb = new ConcurrentHashMap<>();

    public void save(UUID conversationId,Messages message){
        messageDb.computeIfAbsent(conversationId,uuid -> new ConcurrentLinkedQueue<>()).add(message);
    }

    public Queue<Messages> findById(UUID conversationId){
        return messageDb.getOrDefault(conversationId,new ConcurrentLinkedQueue<>());
    }

    @Nullable
    public Messages findLastMessage(UUID conversationId) {
        Queue<Messages> queue = messageDb.get(conversationId);
        if (queue == null || queue.isEmpty()) {
            return null;
        }
        Messages last = null;
        for (Messages message : queue) {
            last = message;
        }
        return last;
    }

    public long countMessages(UUID conversationId) {
        Queue<Messages> queue = messageDb.get(conversationId);
        return queue == null ? 0 : queue.size();
    }

    @Nullable
    public Messages findMessage(UUID conversationId, UUID msgId) {
        Queue<Messages> queue = messageDb.get(conversationId);
        if (queue == null || msgId == null) {
            return null;
        }
        for (Messages message : queue) {
            if (msgId.equals(message.getMsgId())) {
                return message;
            }
        }
        return null;
    }

    private static String truncatePreview(String content) {
        if (content == null) {
            return "";
        }
        String trimmed = content.trim();
        if (trimmed.length() <= 120) {
            return trimmed;
        }
        return trimmed.substring(0, 120) + "…";
    }

    public static String previewOf(Messages message) {
        return message == null ? "" : truncatePreview(message.getContent());
    }
}
