package com.secret.controller;

import com.secret.entity.UserStatus;
import com.secret.entity.Users;
import com.secret.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collection;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;


    @PostMapping
    public ResponseEntity<Users> createUser(@RequestBody Users user) {
        try {
            user.setUserId(UUID.randomUUID());
            if (user.getStatus() == null) {
                user.setStatus(UserStatus.OFFLINE);
            }
            user.setLastActiveAt(Instant.now());
            userRepository.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Users> getUser(@PathVariable UUID userId){

            Users user = userRepository.findById(userId);
            if(user!=null){
                return  ResponseEntity.ok(user);
            }else {
                return ResponseEntity.notFound().build();
            }

    }

    @GetMapping
    public ResponseEntity<Collection<Users>> getAllUsers(){
            return  ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId){
        Users user = userRepository.findById(userId);
        if(user!=null) {
            userRepository.delete(userId);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        else
            return ResponseEntity.notFound().build();
    }

}
