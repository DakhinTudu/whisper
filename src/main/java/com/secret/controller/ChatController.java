package com.secret.controller;

import com.secret.dto.ChatMessageRequest;
import com.secret.dto.TypingRequest;
import com.secret.entity.MessageStatus;
import com.secret.entity.Messages;
import com.secret.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;


    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest request){

        // BUILD
        Messages messages = new Messages();
        messages.setMsgId(UUID.randomUUID());
        messages.setConversationId(request.getConversationId());
        messages.setContent(request.getContent());
        messages.setSenderId(request.getSenderId());
        messages.setStatus(MessageStatus.SENT);
        messages.setCreatedAt(Instant.now());

        if (request.getReplyToMsgId() != null) {
            Messages parent = messageRepository.findMessage(
                    request.getConversationId(),
                    request.getReplyToMsgId()
            );
            if (parent != null) {
                messages.setReplyToMsgId(parent.getMsgId());
                messages.setReplyPreview(MessageRepository.previewOf(parent));
                messages.setReplySenderId(parent.getSenderId());
            }
        }

        // SAVE
        messageRepository.save(request.getConversationId(),messages);

        // BROADCAST to the SUBSCRIBER
        simpMessagingTemplate.convertAndSend("/topic/chat/"+request.getConversationId(),messages);
    }

    @MessageMapping("/chat.typing")
    public void broadcastTyping(TypingRequest request){
        simpMessagingTemplate.convertAndSend("/topic/chat/" + request.getConversationId() + "/typing", request);
    }

}
