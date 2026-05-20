package com.secret.dto;

import com.secret.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class UserPresenceResponse {
    private UUID userId;
    private UserStatus status;
}
