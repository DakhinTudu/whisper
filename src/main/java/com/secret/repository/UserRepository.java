package com.secret.repository;

import com.secret.entity.Users;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class UserRepository {
private final ConcurrentHashMap<UUID, Users> usersDb = new ConcurrentHashMap<>();

public void save(Users user){
    usersDb.put(user.getUserId(),user);
}

public Users findById(UUID userId){
   return usersDb.get(userId);
}

public Collection<Users> findAll(){
    return usersDb.values();
}
public void delete(UUID userId){
    usersDb.remove(userId);
}
}
