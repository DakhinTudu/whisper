import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useConversationSessions } from './hooks/useConversationSessions';
import { useUsers } from './hooks/useUsers';
import { api } from './services/api';
import { ChatView } from './components/ChatView/ChatView';
import { JoinModal } from './components/JoinModal/JoinModal';
import { ProfilePanel } from './components/ProfilePanel/ProfilePanel';
import { RightPanel } from './components/RightPanel/RightPanel';
import { Sidebar } from './components/Sidebar/Sidebar';
import { UserCard } from './components/UserCard/UserCard';
import type { User } from './types';

type MobileTab = 'feed' | 'chats' | 'profile';

function App() {
  const { currentUser, isConnected, setIsConnected, login, logout, authLoading } = useAuth();
  const { users, onlineCount, connectWs, refreshUsers } = useUsers(currentUser?.userId, isConnected);

  const [joinOpen, setJoinOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [panelUser, setPanelUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('feed');
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!currentUser || isConnected) return;
    connectWs(currentUser.userId, () => setIsConnected(true)).catch(() => {
      setIsConnected(false);
    });
  }, [currentUser, isConnected, connectWs, setIsConnected]);

  const findUser = useCallback(
    (userId: string): User | undefined => {
      if (currentUser?.userId === userId) return currentUser;
      return users.find((u) => u.userId === userId);
    },
    [currentUser, users]
  );

  const {
    sessionList,
    clearAll: clearSessions,
    ensureSession,
    updateSessionPreview,
    onIncomingMessage: notifySessionIncoming,
    clearUnread,
    registerConversation,
  } = useConversationSessions(
    currentUser?.userId,
    isConnected,
    activeChatUser?.userId ?? null
  );

  const openJoin = () => setJoinOpen(true);

  const openProfile = useCallback(() => {
    if (!currentUser) {
      openJoin();
      return;
    }
    setShowProfile(true);
    setActiveChatUser(null);
    setPanelUser(null);
    setSidebarOpen(false);
    setMobileTab('profile');
  }, [currentUser]);

  const closeProfile = useCallback(() => {
    setShowProfile(false);
    setMobileTab('feed');
  }, []);

  const handleJoin = async (nickname: string, bio: string, avatarIndex: number) => {
    await login(nickname, bio, avatarIndex);
    await refreshUsers();
    setJoinOpen(false);
    setSidebarOpen(false);
  };

  const handleSelectUser = (user: User) => {
    if (!currentUser) {
      openJoin();
      return;
    }
    if (user.userId === currentUser.userId) return;
    setShowProfile(false);
    setPanelUser(user);
    setActiveChatUser(user);
    ensureSession(user);
    clearUnread(user.userId);
    if (isMobile) setMobileTab('feed');
  };

  const handleSelectChat = async (userId: string) => {
    if (!currentUser) {
      openJoin();
      return;
    }
    let user = findUser(userId);
    if (!user) {
      try {
        user = await api.getUser(userId);
      } catch {
        return;
      }
    }
    handleSelectUser(user);
    setSidebarOpen(false);
  };

  const handleCloseChat = () => {
    setActiveChatUser(null);
    setPanelUser(null);
  };

  const handleMessagesChange = useCallback(
    (recipientId: string, preview: string, count: number) => {
      setMessageCounts((prev) => ({ ...prev, [recipientId]: count }));
      const user = findUser(recipientId);
      updateSessionPreview(recipientId, preview, count, user?.username);
    },
    [findUser, updateSessionPreview]
  );

  const handleIncomingMessage = useCallback(
    (recipientId: string, preview: string) => {
      const user = findUser(recipientId);
      const isChatOpen = activeChatUser?.userId === recipientId;
      notifySessionIncoming(recipientId, preview, user?.username);
      if (!isChatOpen) {
        setMessageCounts((c) => ({ ...c, [recipientId]: (c[recipientId] ?? 0) + 1 }));
      }
    },
    [findUser, activeChatUser, notifySessionIncoming]
  );

  const handleLogout = async () => {
    await logout();
    setActiveChatUser(null);
    setPanelUser(null);
    setShowProfile(false);
    clearSessions();
    setMessageCounts({});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (joinOpen) setJoinOpen(false);
      else if (showProfile) closeProfile();
      else if (activeChatUser) handleCloseChat();
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [joinOpen, activeChatUser, showProfile, closeProfile]);

  const chatActive = !!activeChatUser && !!currentUser;
  const rightPanelUser = panelUser ?? activeChatUser;

  if (authLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Loading Whisper…
      </div>
    );
  }

  return (
    <>
      <div className="ambient-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="app-container">
        <div
          className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <Sidebar
          open={sidebarOpen}
          loggedIn={!!currentUser}
          sessions={sessionList}
          activeChatUserId={activeChatUser?.userId ?? null}
          onSelectChat={handleSelectChat}
        />

        <main className="main-content">
          <header className="main-header">
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              ☰
            </button>
            <div>
              <div className="main-header-title">🟢 Online Now</div>
              <div className="main-header-subtitle">
                <span className="live-dot" />
                <span>{onlineCount}</span> people online
              </div>
            </div>
            {currentUser ? (
              <button
                type="button"
                className="btn-join"
                style={{
                  background: 'var(--bg-card)',
                  boxShadow: 'none',
                  border: '1px solid var(--border-medium)',
                }}
                onClick={openProfile}
              >
                👋 {currentUser.username}
              </button>
            ) : (
              <button type="button" className="btn-join" onClick={openJoin}>
                ✨ Join Chat
              </button>
            )}
          </header>

          <div
            className="content-scroll"
            style={
              chatActive && isMobile
                ? { display: 'none' }
                : showProfile && isMobile
                  ? { display: 'block' }
                  : undefined
            }
          >
            {showProfile && currentUser && isMobile ? (
              <ProfilePanel
                user={currentUser}
                embedded
                onDelete={handleLogout}
                onClose={closeProfile}
              />
            ) : (
              <div className="users-grid users-grid--tiles">
                {users.length === 0 ? (
                  <p className="feed-empty">
                    {currentUser
                      ? 'No one else is online right now.'
                      : 'Join to see who is online and start chatting.'}
                  </p>
                ) : (
                  users.map((u) => (
                    <UserCard
                      key={u.userId}
                      user={u}
                      isTyping={u.status === 'TYPING'}
                      onClick={() => handleSelectUser(u)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {currentUser && (
            <ChatView
              active={chatActive}
              currentUserId={currentUser.userId}
              recipient={activeChatUser}
              onBack={handleCloseChat}
              onMessagesChange={handleMessagesChange}
              onIncomingMessage={handleIncomingMessage}
              onConversationReady={registerConversation}
            />
          )}
        </main>

        <RightPanel
          user={rightPanelUser}
          currentUser={currentUser}
          showOwnProfile={showProfile}
          currentUserId={currentUser?.userId ?? null}
          messageCount={rightPanelUser ? messageCounts[rightPanelUser.userId] ?? 0 : 0}
          onDeleteAccount={handleLogout}
        />
      </div>

      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoin={handleJoin} />

      <nav className="mobile-nav">
        <button
          type="button"
          className={`mobile-nav-btn${mobileTab === 'feed' ? ' active' : ''}`}
          onClick={() => {
            setMobileTab('feed');
            setShowProfile(false);
            handleCloseChat();
            setSidebarOpen(false);
          }}
        >
          <span className="nav-icon">🏠</span> Feed
        </button>
        <button
          type="button"
          className={`mobile-nav-btn${mobileTab === 'chats' ? ' active' : ''}`}
          onClick={() => {
            setMobileTab('chats');
            if (currentUser) setSidebarOpen(true);
            else openJoin();
          }}
        >
          <span className="nav-icon">💬</span> Chats
        </button>
        <button
          type="button"
          className={`mobile-nav-btn${mobileTab === 'profile' ? ' active' : ''}`}
          onClick={() => {
            if (currentUser) openProfile();
            else openJoin();
          }}
        >
          <span className="nav-icon">👤</span> Profile
        </button>
      </nav>
    </>
  );
}

export default App;
