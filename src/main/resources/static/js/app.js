let stompClient = null;
let currentUser = null;
let activeRecipient = null;
let currentConversationId = null;
let typingTimeout = null;
let lastTypingState = null;

// UI Elements
const messageInput = document.getElementById('messageInput');
const messageContainer = document.getElementById('messageContainer');
const userListContainer = document.getElementById('userList');
const feedView = document.getElementById('feedView');
const chatView = document.getElementById('chatView');
const typingIndicator = document.getElementById('typingIndicator');
const myProfileArea = document.getElementById('myProfile');
const creationHero = document.getElementById('accountCreationHero');

/**
 * Application Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initializing...");
    
    // 1. Check for existing session
    const savedUserId = localStorage.getItem('chat_userId');
    const savedUserName = localStorage.getItem('chat_username');
    
    if (savedUserId && savedUserName) {
        console.log("Found existing session for:", savedUserName);
        selectSelf(savedUserId, savedUserName);
    }

    fetchAllUsers();
    
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('createUserBtn').addEventListener('click', createAndLogin);
    document.getElementById('closeChat').addEventListener('click', closeChatInterface);
    document.getElementById('deleteTrigger').addEventListener('click', deleteProfile);

    document.getElementById('newUsername').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createAndLogin();
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
        sendTypingNotification();
    });
});

/**
 * Navigation Controllers
 */
function openChatInterface() {
    console.log("Opening chat interface...");
    feedView.style.display = 'none';
    chatView.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeChatInterface() {
    console.log("Closing chat interface...");
    chatView.style.display = 'none';
    feedView.style.display = 'block';
    document.body.style.overflow = 'auto';
    activeRecipient = null;
}

/**
 * API Calls
 */
async function fetchAllUsers() {
    try {
        const response = await fetch('/users');
        if (!response.ok) throw new Error("Failed to load users");
        const users = await response.json();
        console.log("Users loaded:", users.length);
        window.allUsers = users;
        renderUserList();
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

async function createAndLogin() {
    const usernameInput = document.getElementById('newUsername');
    const name = usernameInput.value.trim();
    if (!name) return alert('Please enter a name');

    console.log("Creating user:", name);
    try {
        const response = await fetch('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name })
        });
        
        if (response.ok) {
            // Re-fetch to get the assigned UUID
            const res = await fetch('/users');
            const users = await res.json();
            window.allUsers = users; // Update global list
            
            const newUser = users.find(u => u.username === name);
            if (newUser) {
                console.log("User created successfully:", newUser.userId);
                selectSelf(newUser.userId, newUser.username);
            }
        } else {
            alert("Error creating account. Try a different name.");
        }
    } catch (err) {
        console.error('Error creating user:', err);
    }
}

/**
 * Set current logged-in user
 */
function selectSelf(userId, username) {
    currentUser = { userId, username };
    
    // Save to local storage for persistence
    localStorage.setItem('chat_userId', userId);
    localStorage.setItem('chat_username', username);

    creationHero.style.display = 'none';
    myProfileArea.style.display = 'flex';
    document.getElementById('myName').innerText = username;
    document.getElementById('myMiniAvatar').innerText = username.substring(0, 2).toUpperCase();

    renderUserList(); 
    connectToWebsocket();
}

/**
 * WebSocket Logic
 */
function connectToWebsocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    const headers = { userId: currentUser.userId };
    stompClient.connect(headers, () => {
        console.log('STOMP Connected as:', currentUser.username);
        
        stompClient.subscribe('/topic/chat.status', (payload) => {
            const update = JSON.parse(payload.body);
            console.log("Status Alert:", update);
            updateUserPresenceInLists(update.userId, update.status);
        });
    }, (err) => {
        console.error("STOMP Connection Error:", err);
    });
}

/**
 * Presence Sync
 */
function updateUserPresenceInLists(userId, status) {
    if (window.allUsers) {
        const user = window.allUsers.find(u => u.userId === userId);
        if (user) {
            user.status = status;
            renderUserList();
        } else {
            // New user joined that we didn't know about!
            fetchAllUsers();
        }
    }

    if (activeRecipient && activeRecipient.userId === userId) {
        const txt = document.getElementById('chatStatusText');
        txt.innerText = status;
        txt.style.color = status === 'ONLINE' ? 'var(--online)' : 'var(--text-dim)';
    }
}

/**
 * User Grid Rendering (Discovery Feed)
 */
function renderUserList() {
    if (!window.allUsers) return;

    // Filter out self
    const displayList = window.allUsers.filter(u => 
        u.userId !== (currentUser ? currentUser.userId : null)
    );

    // Sort: Online first
    displayList.sort((a, b) => {
        if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1;
        if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1;
        return 0;
    });

    document.getElementById('onlineCount').innerText = `${displayList.filter(u => u.status === 'ONLINE').length} people online`;

    if (displayList.length === 0) {
        userListContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; border: 1px dashed var(--border); border-radius: 20px;">
                <p style="color: var(--text-dim);">No other users found yet. Invite a friend to start chatting!</p>
            </div>
        `;
        return;
    }

    userListContainer.innerHTML = displayList.map(user => {
        const isOnline = user.status === 'ONLINE';
        return `
            <div class="social-card" onclick="startChatWith('${user.userId}', '${user.username}')">
                <div class="avatar-large" style="${isOnline ? 'border-color: var(--online);' : 'filter: grayscale(1); opacity: 0.5;'}">
                    ${user.username.substring(0, 2).toUpperCase()}
                    ${isOnline ? '<div class="online-badge"></div>' : ''}
                </div>
                <h3>${user.username}</h3>
            </div>
        `;
    }).join('');
}

/**
 * Chat Controller
 */
async function startChatWith(userId, username) {
    if (!currentUser) return alert('Please enter your name in the top box to create a profile first!');

    console.log("Starting chat with:", username);
    activeRecipient = { userId, username };
    
    // UI Setup
    document.getElementById('chatName').innerText = username;
    const miniAvatar = document.getElementById('chatAvatar');
    miniAvatar.innerText = username.substring(0, 2).toUpperCase();
    
    const userStatus = window.allUsers.find(u => u.userId === userId)?.status || 'OFFLINE';
    document.getElementById('chatStatusText').innerText = userStatus;
    document.getElementById('messageContainer').innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-dim); font-size: 0.8rem;">
            Secure end-to-end conversation with ${username}
        </div>
    `;
    
    openChatInterface();

    try {
        const response = await fetch('/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user1Id: currentUser.userId,
                user2Id: userId
            })
        });
        const conv = await response.json();
        currentConversationId = conv.conversationId;
        
        subscribeToConversation(currentConversationId);
        fetchHistory(currentConversationId);
    } catch (err) {
        console.error("Conversation setup failed:", err);
    }
}

let currentSubscription = null;
let currentTypingSubscription = null;

function subscribeToConversation(conversationId) {
    if (currentSubscription) currentSubscription.unsubscribe();
    if (currentTypingSubscription) currentTypingSubscription.unsubscribe();

    currentSubscription = stompClient.subscribe(`/topic/chat/${conversationId}`, (p) => {
        displayMessage(JSON.parse(p.body));
    });

    currentTypingSubscription = stompClient.subscribe(`/topic/chat/${conversationId}/typing`, (p) => {
        const data = JSON.parse(p.body);
        if (data.senderId !== currentUser.userId) {
            typingIndicator.innerText = data.isTyping ? `${activeRecipient.username} is typing...` : '';
        }
    });
}

function displayMessage(msg) {
    const isSent = msg.senderId === currentUser.userId;
    const div = document.createElement('div');
    div.className = `msg ${isSent ? 'sent' : 'received'}`;
    const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `${msg.content} <span style="display: block; font-size: 0.6rem; opacity: 0.6; margin-top: 4px;">${time}</span>`;
    messageContainer.appendChild(div);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

async function fetchHistory(conversationId) {
    try {
        const response = await fetch(`/messages/${conversationId}`);
        const history = await response.json();
        history.forEach(displayMessage);
    } catch (err) {
        console.error("Failed to load history.");
    }
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentConversationId) return;
    stompClient.send('/app/chat.send', {}, JSON.stringify({
        senderId: currentUser.userId,
        conversationId: currentConversationId,
        content: content
    }));
    messageInput.value = '';
    sendTypingStatus(false);
}

function sendTypingNotification() {
    sendTypingStatus(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => sendTypingStatus(false), 2000);
}

function sendTypingStatus(isTyping) {
    if (!stompClient || !currentConversationId || lastTypingState === isTyping) return;
    lastTypingState = isTyping;
    stompClient.send('/app/chat.typing', {}, JSON.stringify({
        conversationId: currentConversationId,
        senderId: currentUser.userId,
        isTyping: isTyping
    }));
}

async function deleteProfile() {
    if (!confirm("Are you sure you want to delete your profile?")) return;
    try {
        await fetch(`/users/${currentUser.userId}`, { method: 'DELETE' });
        // Clear session on delete
        localStorage.removeItem('chat_userId');
        localStorage.removeItem('chat_username');
        location.reload();
    } catch (err) {
        alert("Failed to delete profile.");
    }
}
