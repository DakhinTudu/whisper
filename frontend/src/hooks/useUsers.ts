import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, PresenceUpdate } from '../types';
import { api } from '../services/api';
import { ws } from '../services/websocket';

export function useUsers(currentUserId: string | undefined, isConnected: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const hasConnected = useRef(false);

  const refreshUsers = useCallback(() => {
    return api.getAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    if (currentUserId) {
      refreshUsers();
    }
  }, [currentUserId, refreshUsers]);

  // Allow reconnect after logout (hasConnected was never reset before)
  useEffect(() => {
    if (!currentUserId) {
      hasConnected.current = false;
    }
  }, [currentUserId]);

  const connectWs = useCallback(
    async (userId: string, onConnected: () => void) => {
      if (hasConnected.current && ws.isConnected()) {
        onConnected();
        return;
      }
      hasConnected.current = true;

      try {
        await ws.connect(userId, (update: PresenceUpdate) => {
          setUsers((prev) => {
            const idx = prev.findIndex((u) => u.userId === update.userId);
            if (idx === -1) {
              refreshUsers();
              return prev;
            }
            const copy = [...prev];
            copy[idx] = { ...copy[idx], status: update.status };
            return copy;
          });
        });
        onConnected();
        await refreshUsers();
      } catch (err) {
        console.error('WebSocket connect failed:', err);
        hasConnected.current = false;
        throw err;
      }
    },
    [refreshUsers]
  );

  const isOnline = (u: User) => u.status === 'ONLINE' || u.status === 'TYPING';

  const onlineUsers = users
    .filter((u) => u.userId !== currentUserId && isOnline(u))
    .sort((a, b) => a.username.localeCompare(b.username));

  const onlineCount = onlineUsers.length;

  return { users: onlineUsers, onlineCount, connectWs, refreshUsers, wsConnected: isConnected };
}
