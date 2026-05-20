package com.secret.entity;


import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Users {
    private UUID userId;
    private String username;
    private String email;
    /** Optional status line shown on the user profile. */
    @JsonAlias("user_bio")
    private String userBio;
    private UserStatus status;
    private Instant lastActiveAt;
}
