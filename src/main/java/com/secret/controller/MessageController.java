package com.secret.controller;


import com.secret.entity.Messages;
import com.secret.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Queue;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;


    @GetMapping("/{conversationId}")
    public ResponseEntity<Queue<Messages>> getMessages(@PathVariable UUID conversationId){
       Queue<Messages> messages = messageRepository.findById(conversationId);
        if(messages == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(messages);
    }
}
