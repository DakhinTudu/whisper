package com.secret.configs.websocket;

import com.secret.dto.UserPresenceResponse;
import com.secret.entity.UserStatus;
import com.secret.entity.Users;
import com.secret.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListner {
    private final UserRepository userRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @EventListener
    public void handleWebSocketConnectListner(SessionConnectEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        log.info("Received a new web socket connection attempt");

        // 1. Retrieve the userId sent by the client in the native headers
        List<String> userIdHeader = headerAccessor.getNativeHeader("userId");

        if(userIdHeader!=null && !userIdHeader.isEmpty()){
            UUID userId = UUID.fromString(userIdHeader.get(0));
            log.info("User connected: {}", userId);

            // 2. Save the userId inside the WebSocket session attributes
            // so we can access it during the disconnect event later
            if(headerAccessor.getSessionAttributes()!=null){
                headerAccessor.getSessionAttributes().put("userId",userId);
            }
            // 3. Update the database/repository
            Users user = userRepository.findById(userId);
            if(user!=null){
                user.setStatus(UserStatus.ONLINE);
                user.setLastActiveAt(Instant.now());
                userRepository.save(user);
                // 4. Broadcast status to all subscribers
                simpMessagingTemplate.convertAndSend("/topic/chat.status", new UserPresenceResponse(userId,UserStatus.ONLINE));
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListner(SessionDisconnectEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 1. Retrieve the userId from the session attributes we saved on connect
        if(headerAccessor.getSessionAttributes()!=null){
            UUID userId = (UUID) headerAccessor.getSessionAttributes().get("userId");

            if(userId!=null){
                log.info("User disconnected: {}", userId);

                // 2. Update the database/repository
                Users user = userRepository.findById(userId);
                if(user!=null){
                    user.setStatus(UserStatus.OFFLINE);
                    user.setLastActiveAt(Instant.now());
                    userRepository.save(user);

                    // 3. Broadcast status to all subscribers
                    simpMessagingTemplate.convertAndSend("/topic/chat.status", new UserPresenceResponse(userId,UserStatus.OFFLINE));
                }
            }

        }
    }
}
