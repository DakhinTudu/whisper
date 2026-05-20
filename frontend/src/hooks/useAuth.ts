import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { ws } from '../services/websocket';
import { clearProfileExtras, saveProfileExtras } from '../utils/profile';

const STORAGE_KEY_ID = 'chat_userId';
const STORAGE_KEY_NAME = 'chat_username';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_ID);
    if (!savedId) {
      setAuthLoading(false);
      return;
    }

    api
      .getUser(savedId)
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY_NAME, user.username);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY_ID);
        localStorage.removeItem(STORAGE_KEY_NAME);
        clearProfileExtras();
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = useCallback(async (username: string, userBio?: string, avatarIndex?: number) => {
    const created = await api.createUser({
      username,
      userBio: userBio?.trim() || undefined,
    });
    localStorage.setItem(STORAGE_KEY_ID, created.userId);
    localStorage.setItem(STORAGE_KEY_NAME, created.username);
    if (avatarIndex != null) {
      saveProfileExtras(created.userBio ?? userBio ?? '', avatarIndex);
    }
    setCurrentUser(created);
  }, []);

  const logout = useCallback(async () => {
    if (currentUser) {
      await api.deleteUser(currentUser.userId);
    }
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_NAME);
    clearProfileExtras();
    ws.disconnect();
    setCurrentUser(null);
    setIsConnected(false);
  }, [currentUser]);

  return { currentUser, isConnected, setIsConnected, login, logout, authLoading };
}
