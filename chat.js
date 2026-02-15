// Chat.js - Advanced Chat System with Mobile-First Flow - FIXED VERSION

// DOM Elements
let chatElements = {
    sidebar: null,
    chatMain: null,
    messagesContainer: null,
    messageInput: null,
    sendBtn: null,
    uploadBtn: null,
    mentionBtn: null
};

// Firebase
let chatDatabase = null;
let storage = null;

// Current state
let currentChatUser = null;
let currentGroup = null;
let chatUsers = [];
let groups = [];
let messagesRef = null;
let loggedInUser = null;
let isGroupChat = false;

// Mobile view
let isMobileView = false;
let currentSelectedItem = null;

// Reply system
let replyToMessage = null;
let replyPreview = null;

// Image handling
let selectedImage = null;
let imagePreview = null;

// Active status tracking
let activeUsers = {};

// Notification tracking
let notifications = {
    users: {},
    groups: {}
};

// Message cache for replies
let messageCache = new Map();

// Initialize chat
function initializeChat() {
    console.log("Initializing advanced chat system...");
    
    // Get current user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        alert("Please login first!");
        window.location.href = "me.html";
        return;
    }
    
    try {
        loggedInUser = JSON.parse(savedUser);
        
        // Check if user is VIP
        const VIP_IDS = [
            "00191520", "20202020", "00192621", "00193722", 
            "59200311", "60059500", "52044379", "20529519", 
            "50522654"
        ];
        
        if (!loggedInUser.uniqueId || !VIP_IDS.includes(loggedInUser.uniqueId)) {
            alert("Only VIP members can access chat!");
            window.location.href = "me.html";
            return;
        }
        
        // Initialize Firebase for chat
        initializeFirebaseForChat();
        
        // Setup DOM elements
        setupChatElements();
        
        // Check if mobile
        checkMobileView();
        
        // Disable input initially
        disableMessageInput();
        
        // Initialize modals
        initializeModals();
        
        // Setup user status tracking
        setupUserStatus();
        
        // Load VIP users and groups
        loadVIPUsers();
        loadGroups();
        
        // Setup event listeners
        setupChatEventListeners();
        
        // Setup auto-update for notifications in nav
        updateNavNotifications();
        
        // Setup mobile back button
        setupMobileBackButton();
        
        console.log("Chat system initialized successfully");
        
    } catch (error) {
        console.error("Error initializing chat:", error);
        alert("Error loading chat. Please refresh the page.");
    }
}

// Initialize Firebase for chat
function initializeFirebaseForChat() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyAEhu5To-5_jd8qGQHvLkQXxcjxWsqRIu8",
            authDomain: "fai-media.firebaseapp.com",
            databaseURL: "https://fai-media-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "fai-media",
            storageBucket: "fai-media.firebasestorage.app",
            messagingSenderId: "946674905506",
            appId: "1:946674905506:web:e229628996a19ac4b6c2fb",
            measurementId: "G-4BY13FEQ4W"
        };
        
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase app initialized");
        } else {
            console.log("Firebase app already initialized");
        }
        
        // Get database reference
        chatDatabase = firebase.database();
        console.log("Database initialized");
        
        // Try to get storage reference
        try {
            if (firebase.storage) {
                storage = firebase.storage();
                console.log("Storage initialized successfully");
            } else {
                console.log("Firebase Storage not available, will use data URLs");
                storage = null;
            }
        } catch (storageError) {
            console.warn("Could not initialize storage:", storageError);
            storage = null;
        }
        
    } catch (error) {
        console.error("Firebase initialization error:", error);
        // Try to continue with just database
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyAEhu5To-5_jd8qGQHvLkQXxcjxWsqRIu8",
                    databaseURL: "https://fai-media-default-rtdb.asia-southeast1.firebasedatabase.app"
                });
            }
            chatDatabase = firebase.database();
            storage = null;
            console.log("Initialized without storage");
        } catch (fallbackError) {
            console.error("Complete initialization failed:", fallbackError);
            alert("Cannot connect to database. Please check your internet.");
        }
    }
}

// Setup DOM elements
function setupChatElements() {
    chatElements.sidebar = document.querySelector('.chat-sidebar');
    chatElements.chatMain = document.getElementById('chatMain');
    chatElements.messagesContainer = document.getElementById('messagesContainer');
    chatElements.messageInput = document.getElementById('messageInput');
    chatElements.sendBtn = document.getElementById('sendBtn');
    chatElements.uploadBtn = document.getElementById('uploadBtn');
    chatElements.mentionBtn = document.getElementById('mentionBtn');
    
    if (!chatElements.messagesContainer) {
        chatElements.messagesContainer = document.querySelector('.messages-container');
    }
    
    console.log("DOM elements setup complete");
}

// Check mobile view
function checkMobileView() {
    isMobileView = window.innerWidth <= 768;
    
    if (isMobileView) {
        // Ensure chat main is hidden initially on mobile
        if (chatElements.chatMain) {
            chatElements.chatMain.classList.add('mobile-hidden');
            chatElements.chatMain.style.display = 'none';
        }
        // Show sidebar full width
        if (chatElements.sidebar) {
            chatElements.sidebar.style.display = 'flex';
        }
    } else {
        // Show both sidebar and chat on desktop
        if (chatElements.chatMain) {
            chatElements.chatMain.classList.remove('mobile-hidden');
            chatElements.chatMain.style.display = 'flex';
        }
    }
    
    // Add resize listener
    window.addEventListener('resize', function() {
        const wasMobile = isMobileView;
        isMobileView = window.innerWidth <= 768;
        
        if (wasMobile !== isMobileView) {
            if (!isMobileView) {
                // Switching to desktop - ensure both are visible
                if (chatElements.chatMain) {
                    chatElements.chatMain.classList.remove('mobile-hidden');
                    chatElements.chatMain.style.display = 'flex';
                }
                if (chatElements.sidebar) {
                    chatElements.sidebar.style.display = 'flex';
                }
                // Hide mobile back button
                const mobileBackBtn = document.getElementById('mobileBackBtn');
                if (mobileBackBtn) mobileBackBtn.style.display = 'none';
            } else {
                // Switching to mobile - show contacts first
                if (chatElements.chatMain) {
                    chatElements.chatMain.classList.add('mobile-hidden');
                    chatElements.chatMain.style.display = 'none';
                }
                if (chatElements.sidebar) {
                    chatElements.sidebar.style.display = 'flex';
                }
            }
        }
    });
}

// Setup mobile back button
function setupMobileBackButton() {
    const mobileBackBtn = document.getElementById('mobileBackBtn');
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', closeChatOnMobile);
        mobileBackBtn.style.display = 'none';
    }
}

// Initialize modals
function initializeModals() {
    const modalHTML = `
        <div class="modal-overlay" id="groupModalOverlay">
            <div class="group-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> Create Group</h3>
                    <button class="close-modal" id="closeGroupModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="groupName">Group Name *</label>
                        <input type="text" id="groupName" placeholder="Enter group name" required>
                    </div>
                    <div class="form-group">
                        <label>Select VIP Members *</label>
                        <div id="groupMembersList" class="members-list"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn cancel-btn" id="cancelGroupBtn">Cancel</button>
                    <button class="btn" id="createGroupBtn">Create Group</button>
                </div>
            </div>
        </div>
        
        <div class="modal-overlay" id="imageModalOverlay">
            <div class="group-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-image"></i> Image Preview</h3>
                    <button class="close-modal" id="closeImageModal">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img id="fullImagePreview" src="" alt="Full size image" style="max-width: 100%; max-height: 400px; border-radius: 10px;">
                </div>
            </div>
        </div>
        
        <div class="modal-overlay" id="groupManageModalOverlay">
            <div class="group-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> Manage Group</h3>
                    <button class="close-modal" id="closeGroupManageModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="groupManageContent"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn" id="closeManageModalBtn">Close</button>
                </div>
            </div>
        </div>
        
        <div class="modal-overlay" id="deleteConfirmModal">
            <div class="group-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-trash"></i> Delete Message</h3>
                    <button class="close-modal" id="closeDeleteModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p id="deleteMessageText">Are you sure you want to delete this message?</p>
                    <div class="delete-options">
                        <label>
                            <input type="radio" name="deleteOption" value="me" checked>
                            Delete for me only
                        </label>
                        <label>
                            <input type="radio" name="deleteOption" value="everyone">
                            Delete for everyone
                        </label>
                    </div>
                    <p class="delete-warning" id="deleteWarning"></p>
                </div>
                <div class="modal-footer">
                    <button class="btn cancel-btn" id="cancelDeleteBtn">Cancel</button>
                    <button class="btn delete-btn" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Modal event listeners
    const setupModalListeners = () => {
        document.getElementById('closeGroupModal').addEventListener('click', () => {
            document.getElementById('groupModalOverlay').style.display = 'none';
        });
        
        document.getElementById('cancelGroupBtn').addEventListener('click', () => {
            document.getElementById('groupModalOverlay').style.display = 'none';
        });
        
        document.getElementById('closeImageModal').addEventListener('click', () => {
            document.getElementById('imageModalOverlay').style.display = 'none';
        });
        
        document.getElementById('closeGroupManageModal').addEventListener('click', () => {
            document.getElementById('groupManageModalOverlay').style.display = 'none';
        });
        
        document.getElementById('closeManageModalBtn').addEventListener('click', () => {
            document.getElementById('groupManageModalOverlay').style.display = 'none';
        });
        
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            document.getElementById('deleteConfirmModal').style.display = 'none';
        });
        
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('deleteConfirmModal').style.display = 'none';
        });
        
        // Close modals on outside click
        ['groupModalOverlay', 'imageModalOverlay', 'groupManageModalOverlay', 'deleteConfirmModal'].forEach(id => {
            document.getElementById(id).addEventListener('click', (e) => {
                if (e.target.id === id) {
                    document.getElementById(id).style.display = 'none';
                }
            });
        });
        
        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteMessage);
        
        // Delete option change
        document.querySelectorAll('input[name="deleteOption"]').forEach(radio => {
            radio.addEventListener('change', updateDeleteWarning);
        });
    };
    
    setTimeout(setupModalListeners, 100);
}

// Setup user status tracking
function setupUserStatus() {
    if (!chatDatabase || !loggedInUser) return;
    
    const userStatusRef = chatDatabase.ref(`userStatus/${loggedInUser.uniqueId}`);
    userStatusRef.set({
        status: 'online',
        lastSeen: Date.now(),
        name: loggedInUser.name || loggedInUser.username
    });
    
    userStatusRef.onDisconnect().set({
        status: 'offline',
        lastSeen: Date.now(),
        name: loggedInUser.name || loggedInUser.username
    });
    
    // Listen for other users' status
    chatDatabase.ref('userStatus').on('value', (snapshot) => {
        if (snapshot.exists()) {
            activeUsers = snapshot.val();
            updateOnlineStatusDisplay();
        }
    });
}

// Update online status display
function updateOnlineStatusDisplay() {
    document.querySelectorAll('.vip-user-item').forEach(item => {
        const uniqueId = item.dataset.uniqueId;
        const statusElement = item.querySelector('.online-status');
        
        if (!statusElement) return;
        
        if (activeUsers[uniqueId]) {
            const status = activeUsers[uniqueId].status;
            statusElement.className = 'online-status ' + status;
        } else {
            statusElement.className = 'online-status offline';
        }
    });
}

// Load VIP users
async function loadVIPUsers() {
    try {
        const snapshot = await chatDatabase.ref('users').once('value');
        
        if (!snapshot.exists()) {
            showNoUsersMessage();
            return;
        }
        
        const users = snapshot.val();
        chatUsers = [];
        
        const VIP_IDS = [
            "00191520", "20202020", "00192621", "00193722", 
            "59200311", "60059500", "52044379", "20529519", 
            "50522654"
        ];
        
        for (let userId in users) {
            const user = users[userId];
            
            if (user.uniqueId && 
                VIP_IDS.includes(user.uniqueId) && 
                user.uniqueId !== loggedInUser.uniqueId) {
                
                chatUsers.push({
                    id: userId,
                    uniqueId: user.uniqueId,
                    name: user.name || user.username || `VIP ${user.uniqueId}`,
                    username: user.username,
                    lastSeen: user.lastLogin || Date.now()
                });
            }
        }
        
        displayVIPUsers();
        
    } catch (error) {
        console.error("Error loading VIP users:", error);
        showNoUsersMessage();
    }
}

// Load groups
async function loadGroups() {
    try {
        const snapshot = await chatDatabase.ref('groups').once('value');
        
        if (!snapshot.exists()) {
            displayGroups();
            return;
        }
        
        const groupsData = snapshot.val();
        groups = [];
        
        for (let groupId in groupsData) {
            const group = groupsData[groupId];
            
            if (group.members && group.members.includes(loggedInUser.uniqueId)) {
                groups.push({
                    id: groupId,
                    name: group.name,
                    members: group.members,
                    admin: group.admin,
                    created: group.created,
                    unread: notifications.groups[groupId] || 0
                });
            }
        }
        
        displayGroups();
        
    } catch (error) {
        console.error("Error loading groups:", error);
        displayGroups();
    }
}

// Display VIP users
function displayVIPUsers() {
    const usersList = document.getElementById('vipUsersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    if (chatUsers.length === 0) {
        usersList.innerHTML = '<div class="no-users-message"><p>No other VIP users found</p></div>';
        return;
    }
    
    chatUsers.forEach(user => {
        const userElement = createUserElement(user);
        usersList.appendChild(userElement);
    });
}

// Create user element
function createUserElement(user) {
    const userElement = document.createElement('div');
    userElement.className = 'vip-user-item';
    userElement.dataset.userId = user.id;
    userElement.dataset.uniqueId = user.uniqueId;
    userElement.dataset.chatId = user.uniqueId;
    userElement.dataset.chatType = 'user';
    
    const firstLetter = user.name.charAt(0).toUpperCase();
    const unreadCount = notifications.users[user.uniqueId] || 0;
    const status = activeUsers[user.uniqueId]?.status || 'offline';
    
    userElement.innerHTML = `
        <div class="user-avatar vip">${firstLetter}</div>
        <div class="vip-user-info">
            <h4>${user.name}</h4>
            <p>${status === 'online' ? 'Online' : 'Offline'}</p>
        </div>
        <div class="online-status ${status}"></div>
        <span class="vip-badge">VIP</span>
        ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
    `;
    
    userElement.addEventListener('click', () => {
        if (isMobileView) {
            openChatOnMobile(user.uniqueId, 'user');
        }
        selectUserChat(user);
        notifications.users[user.uniqueId] = 0;
        updateNotifications();
    });
    
    return userElement;
}

// Display groups
function displayGroups() {
    const groupsList = document.getElementById('groupsListContent');
    if (!groupsList) return;
    
    groupsList.innerHTML = '';
    
    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="no-groups-message"><p>No groups yet. Create one!</p></div>';
        return;
    }
    
    groups.forEach(group => {
        const groupElement = createGroupElement(group);
        groupsList.appendChild(groupElement);
    });
}

// Create group element
function createGroupElement(group) {
    const groupElement = document.createElement('div');
    groupElement.className = 'group-item';
    groupElement.dataset.groupId = group.id;
    groupElement.dataset.chatId = group.id;
    groupElement.dataset.chatType = 'group';
    
    const firstLetter = group.name.charAt(0).toUpperCase();
    const memberCount = group.members ? group.members.length : 0;
    const unreadCount = group.unread || 0;
    const isAdmin = group.admin === loggedInUser.uniqueId;
    
    groupElement.innerHTML = `
        <div class="user-avatar group">${firstLetter}</div>
        <div class="group-info">
            <h4>${group.name} ${isAdmin ? '<i class="fas fa-crown admin-crown" title="Admin"></i>' : ''}</h4>
            <p>${memberCount} members</p>
        </div>
        <span class="group-badge">Group</span>
        ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
    `;
    
    groupElement.addEventListener('click', () => {
        if (isMobileView) {
            openChatOnMobile(group.id, 'group');
        }
        selectGroupChat(group);
        notifications.groups[group.id] = 0;
        updateNotifications();
    });
    
    return groupElement;
}

// Open chat on mobile
function openChatOnMobile(chatId, type = 'user') {
    if (!isMobileView) return;
    
    const chatContainer = document.querySelector('.chat-container');
    const chatMain = document.getElementById('chatMain');
    const mobileBackBtn = document.getElementById('mobileBackBtn');
    const sidebar = document.querySelector('.chat-sidebar');
    
    if (chatContainer && chatMain && mobileBackBtn && sidebar) {
        // Hide sidebar, show chat
        sidebar.style.display = 'none';
        chatMain.style.display = 'flex';
        chatMain.classList.add('chat-active');
        mobileBackBtn.style.display = 'flex';
        
        // Update selected item
        updateSelectedItem(chatId, type);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Close chat on mobile
function closeChatOnMobile() {
    const chatMain = document.getElementById('chatMain');
    const mobileBackBtn = document.getElementById('mobileBackBtn');
    const sidebar = document.querySelector('.chat-sidebar');
    
    if (chatMain && mobileBackBtn && sidebar) {
        // Hide chat, show sidebar
        chatMain.style.display = 'none';
        chatMain.classList.remove('chat-active');
        sidebar.style.display = 'flex';
        mobileBackBtn.style.display = 'none';
        
        // Clear selected item
        if (currentSelectedItem) {
            currentSelectedItem.classList.remove('selected');
            currentSelectedItem = null;
        }
        
        // Enable body scrolling
        document.body.style.overflow = '';
        
        // Clear chat view
        chatElements.messagesContainer.innerHTML = `
            <div class="no-chat-selected">
                <i class="fas fa-comments fa-4x"></i>
                <p>Select a VIP member or group to start chatting</p>
                <small>You can send text, images, and mention other VIPs</small>
            </div>
        `;
        
        disableMessageInput();
        currentChatUser = null;
        currentGroup = null;
        isGroupChat = false;
    }
}

// Update selected item
function updateSelectedItem(chatId, type) {
    if (currentSelectedItem) {
        currentSelectedItem.classList.remove('selected');
    }
    
    const selector = type === 'user' ? 
        `[data-chat-type="user"][data-chat-id="${chatId}"]` :
        `[data-chat-type="group"][data-chat-id="${chatId}"]`;
    
    currentSelectedItem = document.querySelector(selector);
    if (currentSelectedItem) {
        currentSelectedItem.classList.add('selected');
    }
}

// Select user chat
function selectUserChat(user) {
    currentChatUser = user;
    currentGroup = null;
    isGroupChat = false;
    
    updateChatHeader(user.name, false);
    loadChatMessages(user.uniqueId, false);
    switchTab('users');
    enableMessageInput();
    clearReply();
}

// Select group chat
function selectGroupChat(group) {
    currentGroup = group;
    currentChatUser = null;
    isGroupChat = true;
    
    updateChatHeader(group.name, true);
    loadChatMessages(group.id, true);
    switchTab('groups');
    enableMessageInput();
    clearReply();
}

// Enable message input
function enableMessageInput() {
    if (chatElements.messageInput) {
        chatElements.messageInput.disabled = false;
        chatElements.messageInput.placeholder = "Type your message... (Use @ to mention)";
        chatElements.messageInput.focus();
    }
    
    if (chatElements.sendBtn) {
        chatElements.sendBtn.disabled = false;
    }
}

// Disable message input
function disableMessageInput() {
    if (chatElements.messageInput) {
        chatElements.messageInput.disabled = true;
        chatElements.messageInput.placeholder = "Select a chat to start messaging...";
        chatElements.messageInput.value = '';
    }
    
    if (chatElements.sendBtn) {
        chatElements.sendBtn.disabled = true;
    }
    
    removeImagePreview();
    clearReply();
}

// Update chat header
function updateChatHeader(name, isGroup) {
    const chatHeader = document.querySelector('.chat-header');
    if (!chatHeader) return;
    
    const firstLetter = name.charAt(0).toUpperCase();
    const memberCount = isGroup && currentGroup ? currentGroup.members.length : 0;
    const isAdmin = isGroup && currentGroup && currentGroup.admin === loggedInUser.uniqueId;
    
    chatHeader.innerHTML = `
        <div class="chat-header-left">
            <div class="chat-header-avatar ${isGroup ? 'group' : 'vip'}">${firstLetter}</div>
            <div class="chat-header-info">
                <h3>${name} ${isGroup ? '<span class="group-badge">Group</span>' : '<span class="vip-badge">VIP</span>'}</h3>
                <p class="status">
                    ${isGroup ? 
                        `${memberCount} members | ${getOnlineCount()} online` : 
                        (activeUsers[currentChatUser?.uniqueId]?.status === 'online' ? 'Online' : 'Offline')
                    }
                </p>
            </div>
        </div>
        <div class="chat-header-right">
            ${isGroup ? `
                <button class="action-btn" id="groupManageBtn" title="Manage Group">
                    <i class="fas fa-cog"></i>
                </button>
            ` : ''}
            <button class="action-btn" id="clearChatBtn" title="Clear Chat">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    setTimeout(() => {
        if (isGroup) {
            const manageBtn = document.getElementById('groupManageBtn');
            if (manageBtn) manageBtn.addEventListener('click', showGroupManagement);
        }
        const clearBtn = document.getElementById('clearChatBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearChat);
    }, 100);
}

// Get online count in group
function getOnlineCount() {
    if (!currentGroup || !currentGroup.members) return 0;
    
    let onlineCount = 0;
    currentGroup.members.forEach(memberId => {
        if (activeUsers[memberId] && activeUsers[memberId].status === 'online') {
            onlineCount++;
        }
    });
    
    return onlineCount;
}

// Load chat messages - OPTIMIZED VERSION
function loadChatMessages(targetId, isGroup) {
    if (!chatElements.messagesContainer || !chatDatabase) return;
    
    // Show loading indicator
    chatElements.messagesContainer.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
    
    // Unsubscribe from previous listener
    if (messagesRef) {
        messagesRef.off();
    }
    
    // Determine the correct path
    if (isGroup) {
        messagesRef = chatDatabase.ref(`groupChats/${targetId}/messages`);
    } else {
        const chatRoomId = generateChatRoomId(loggedInUser.uniqueId, targetId);
        messagesRef = chatDatabase.ref(`chats/${chatRoomId}/messages`);
    }
    
    // Set up the listener with throttling
    let isProcessing = false;
    let pendingUpdate = false;
    
    messagesRef.orderByChild('timestamp').on('value', (snapshot) => {
        if (isProcessing) {
            pendingUpdate = true;
            return;
        }
        
        isProcessing = true;
        
        setTimeout(() => {
            processMessages(snapshot, isGroup);
            isProcessing = false;
            
            if (pendingUpdate) {
                pendingUpdate = false;
                // Re-trigger update
                messagesRef.once('value').then(processMessages);
            }
        }, 100);
    });
}

// Process messages separately for better performance
function processMessages(snapshot, isGroup) {
    if (!snapshot.exists()) {
        chatElements.messagesContainer.innerHTML = `
            <div class="no-messages">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    const messages = snapshot.val();
    const messagesContainer = chatElements.messagesContainer;
    
    // Clear container
    messagesContainer.innerHTML = '';
    
    // Sort messages by timestamp
    const sortedMessages = Object.keys(messages)
        .map(id => ({ id, ...messages[id] }))
        .sort((a, b) => a.timestamp - b.timestamp);
    
    // Cache messages for reply previews
    sortedMessages.forEach(message => {
        messageCache.set(message.id, message);
    });
    
    // Display messages in batches for better performance
    displayMessagesBatch(sortedMessages, isGroup, 0);
}

// Display messages in batches to prevent UI freeze
function displayMessagesBatch(messages, isGroup, startIndex) {
    const batchSize = 20;
    const endIndex = Math.min(startIndex + batchSize, messages.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        displayMessage(messages[i], isGroup);
    }
    
    if (endIndex < messages.length) {
        setTimeout(() => {
            displayMessagesBatch(messages, isGroup, endIndex);
        }, 50);
    } else {
        scrollToBottom();
        markMessagesAsRead(isGroup ? currentGroup?.id : currentChatUser?.uniqueId, isGroup);
    }
}

// Display a message with reply feature - OPTIMIZED
function displayMessage(message, isGroup) {
    if (!chatElements.messagesContainer) return;
    
    // Check if message should be hidden (deleted for everyone)
    if (message.deleted && message.deletedFor === 'everyone') {
        return;
    }
    
    const messageElement = document.createElement('div');
    const isSent = message.senderId === loggedInUser.uniqueId;
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    messageElement.dataset.messageId = message.id;
    messageElement.dataset.senderId = message.senderId;
    
    const time = new Date(message.timestamp);
    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let messageText = escapeHtml(message.text || '');
    
    // Process mentions - FIXED: Handle mentions properly
    if (message.mentions && Array.isArray(message.mentions)) {
        message.mentions.forEach(mention => {
            if (mention && mention.name) {
                const mentionRegex = new RegExp(`@${escapeRegExp(mention.name)}`, 'g');
                messageText = messageText.replace(mentionRegex, 
                    `<span class="mention">@${mention.name}</span>`);
            }
        });
    }
    
    const isMentioned = message.mentions?.some(m => m && m.id === loggedInUser.uniqueId);
    if (isMentioned && !isSent) {
        messageElement.classList.add('mentioned');
    }
    
    // Check if message is deleted for me only
    if (message.deleted && message.deletedFor === loggedInUser.uniqueId) {
        messageElement.classList.add('deleted-message');
        messageElement.innerHTML = `
            <div class="message-text deleted-text">
                <i class="fas fa-trash"></i> This message was deleted
            </div>
            <div class="message-time">
                <span>${timeString}</span>
            </div>
        `;
        chatElements.messagesContainer.appendChild(messageElement);
        return;
    }
    
    let imageHtml = '';
    if (message.imageUrl && !message.deleted) {
        imageHtml = `<img src="${message.imageUrl}" class="message-image" onclick="showFullImage('${message.imageUrl}')" loading="lazy">`;
    }
    
    // Reply preview if this is a reply
    let replyHtml = '';
    if (message.replyTo && !message.deleted) {
        const repliedMessage = getMessagePreview(message.replyTo.messageId);
        if (repliedMessage) {
            replyHtml = `
                <div class="reply-preview">
                    <div class="reply-line"></div>
                    <div class="reply-content">
                        <div class="reply-sender">${repliedMessage.senderName}</div>
                        <div class="reply-text">${repliedMessage.text ? escapeHtml(repliedMessage.text.substring(0, 50)) + (repliedMessage.text.length > 50 ? '...' : '') : '📷 Image'}</div>
                    </div>
                </div>
            `;
        }
    }
    
    messageElement.innerHTML = `
        ${!isSent && isGroup ? 
            `<div class="message-sender">
                ${getSenderName(message.senderId)}
                ${isMentioned ? '<span class="mention-badge">Mentioned you</span>' : ''}
            </div>` : ''}
        ${!isSent && !isGroup ? 
            `<div class="message-sender">
                ${getSenderName(message.senderId)}
            </div>` : ''}
        ${replyHtml}
        <div class="message-text">${messageText}</div>
        ${imageHtml}
        <div class="message-time">
            <span>${timeString}</span>
            ${isSent ? `<span class="seen-indicator">${message.read ? '✓✓' : '✓'}</span>` : ''}
        </div>
        <div class="message-actions">
            <button class="message-action-btn reply-btn" title="Reply">
                <i class="fas fa-reply"></i>
            </button>
            ${isSent ? `
                <button class="message-action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    chatElements.messagesContainer.appendChild(messageElement);
    
    // Add event listeners to action buttons
    const replyBtn = messageElement.querySelector('.reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setReplyToMessage(message);
        });
    }
    
    const deleteBtn = messageElement.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirm(message);
        });
    }
}

// Get message preview for reply
function getMessagePreview(messageId) {
    if (messageCache.has(messageId)) {
        const message = messageCache.get(messageId);
        return {
            senderName: getSenderName(message.senderId),
            text: message.text || '',
            imageUrl: message.imageUrl
        };
    }
    return null;
}

// Set reply to a message
function setReplyToMessage(message) {
    replyToMessage = message;
    showReplyPreview(message);
}

// Show reply preview above input
function showReplyPreview(message) {
    // Remove existing preview
    clearReply();
    
    const previewText = message.text ? 
        escapeHtml(message.text.substring(0, 100)) + (message.text.length > 100 ? '...' : '') : 
        '📷 Image';
    
    replyPreview = document.createElement('div');
    replyPreview.className = 'reply-preview-container';
    replyPreview.innerHTML = `
        <div class="reply-preview-content">
            <div class="reply-preview-header">
                <span class="reply-label">Replying to ${getSenderName(message.senderId)}</span>
                <button class="close-reply-btn" id="closeReplyBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="reply-preview-text">${previewText}</div>
        </div>
    `;
    
    const inputArea = document.querySelector('.message-input-area');
    if (inputArea) {
        inputArea.insertBefore(replyPreview, inputArea.firstChild);
        
        // Add event listener to close button
        document.getElementById('closeReplyBtn').addEventListener('click', clearReply);
    }
    
    // Focus on input
    if (chatElements.messageInput) {
        chatElements.messageInput.focus();
    }
}

// Clear reply
function clearReply() {
    if (replyPreview) {
        replyPreview.remove();
        replyPreview = null;
    }
    replyToMessage = null;
}

// Show delete confirmation modal - OPTIMIZED
function showDeleteConfirm(message) {
    const modal = document.getElementById('deleteConfirmModal');
    const deleteText = document.getElementById('deleteMessageText');
    const warning = document.getElementById('deleteWarning');
    
    // Set message text
    const messagePreview = message.text ? 
        escapeHtml(message.text.substring(0, 100)) + (message.text.length > 100 ? '...' : '') : 
        'this image';
    
    deleteText.textContent = `Are you sure you want to delete "${messagePreview}"?`;
    
    // Set warning text
    const isGroup = message.isGroup || false;
    const deleteOption = document.querySelector('input[name="deleteOption"]:checked').value;
    
    if (deleteOption === 'me') {
        warning.textContent = 'This message will only be deleted from your view. Others will still see it.';
    } else {
        if (isGroup) {
            warning.textContent = 'This message will be deleted for all group members.';
        } else {
            warning.textContent = 'This message will be deleted for both you and the recipient.';
        }
    }
    
    // Store message data for deletion
    modal.dataset.messageId = message.id;
    modal.dataset.isGroup = isGroup;
    modal.dataset.targetId = isGroup ? currentGroup.id : currentChatUser.uniqueId;
    
    modal.style.display = 'flex';
}

// Update delete warning based on option
function updateDeleteWarning() {
    const deleteOption = document.querySelector('input[name="deleteOption"]:checked').value;
    const warning = document.getElementById('deleteWarning');
    const modal = document.getElementById('deleteConfirmModal');
    const isGroup = modal.dataset.isGroup === 'true';
    
    if (deleteOption === 'me') {
        warning.textContent = 'This message will only be deleted from your view. Others will still see it.';
    } else {
        if (isGroup) {
            warning.textContent = 'This message will be deleted for all group members.';
        } else {
            warning.textContent = 'This message will be deleted for both you and the recipient.';
        }
    }
}

// Confirm delete message - OPTIMIZED with loading state
async function confirmDeleteMessage() {
    const modal = document.getElementById('deleteConfirmModal');
    const messageId = modal.dataset.messageId;
    const isGroup = modal.dataset.isGroup === 'true';
    const targetId = modal.dataset.targetId;
    const deleteOption = document.querySelector('input[name="deleteOption"]:checked').value;
    
    if (!messageId) return;
    
    // Show loading state
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    try {
        let messagePath;
        if (isGroup) {
            messagePath = `groupChats/${targetId}/messages/${messageId}`;
        } else {
            const chatRoomId = generateChatRoomId(loggedInUser.uniqueId, targetId);
            messagePath = `chats/${chatRoomId}/messages/${messageId}`;
        }
        
        // Get current message
        const snapshot = await chatDatabase.ref(messagePath).once('value');
        if (!snapshot.exists()) {
            alert("Message not found");
            return;
        }
        
        const message = snapshot.val();
        
        if (deleteOption === 'me') {
            // Delete for me only - mark as deleted
            const updates = {
                deleted: true,
                deletedAt: Date.now(),
                deletedBy: loggedInUser.uniqueId,
                deletedFor: loggedInUser.uniqueId
            };
            
            await chatDatabase.ref(messagePath).update(updates);
        } else {
            // Delete for everyone - remove from database
            await chatDatabase.ref(messagePath).remove();
            // Also remove from cache
            messageCache.delete(messageId);
        }
        
        console.log("Message deleted successfully");
        modal.style.display = 'none';
        
        // Instead of reloading all messages, just remove the message element
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            if (deleteOption === 'me') {
                messageElement.classList.add('deleted-message');
                messageElement.innerHTML = `
                    <div class="message-text deleted-text">
                        <i class="fas fa-trash"></i> This message was deleted
                    </div>
                    <div class="message-time">
                        <span>${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `;
            } else {
                messageElement.remove();
            }
        }
        
    } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message. Please try again.");
    } finally {
        // Restore button state
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    }
}

// Show full image
function showFullImage(imageUrl) {
    const fullPreview = document.getElementById('fullImagePreview');
    const modal = document.getElementById('imageModalOverlay');
    
    if (fullPreview && modal) {
        fullPreview.src = imageUrl;
        modal.style.display = 'flex';
    }
}

// Upload image to storage
async function uploadImageToStorage(file) {
    return new Promise((resolve, reject) => {
        console.log("Starting image upload...");
        
        // Always use Data URL for now
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log("Image converted to data URL");
            resolve(e.target.result);
        };
        
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

// Send message with reply feature
async function sendMessage() {
    if (!currentChatUser && !currentGroup) {
        alert("Please select a chat first!");
        return;
    }
    
    const messageText = chatElements.messageInput.value.trim();
    
    if (!messageText && !selectedImage) {
        alert("Please type a message or select an image!");
        return;
    }
    
    const originalBtnHTML = chatElements.sendBtn.innerHTML;
    chatElements.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    chatElements.sendBtn.disabled = true;
    
    try {
        const mentions = extractMentions(messageText);
        
        const message = {
            text: messageText,
            senderId: loggedInUser.uniqueId,
            senderName: loggedInUser.name || loggedInUser.username,
            timestamp: Date.now(),
            read: false,
            mentions: mentions
        };
        
        // Add reply data if replying
        if (replyToMessage) {
            message.replyTo = {
                messageId: replyToMessage.id,
                senderId: replyToMessage.senderId,
                senderName: replyToMessage.senderName || getSenderName(replyToMessage.senderId),
                text: replyToMessage.text || '',
                timestamp: replyToMessage.timestamp
            };
        }
        
        // Handle image if selected
        if (selectedImage) {
            console.log("Processing image...");
            try {
                const imageUrl = await uploadImageToStorage(selectedImage);
                message.imageUrl = imageUrl;
                message.hasImage = true;
                message.fileName = selectedImage.name;
                message.fileSize = selectedImage.size;
                console.log("Image processed successfully");
            } catch (imageError) {
                console.error("Image processing failed:", imageError);
            }
        }
        
        let messageRef;
        
        if (isGroupChat && currentGroup) {
            messageRef = chatDatabase.ref(`groupChats/${currentGroup.id}/messages`).push();
            message.receiverId = currentGroup.id;
            message.isGroup = true;
            
            currentGroup.members.forEach(memberId => {
                if (memberId !== loggedInUser.uniqueId) {
                    notifications.groups[currentGroup.id] = (notifications.groups[currentGroup.id] || 0) + 1;
                }
            });
            
        } else if (currentChatUser) {
            const chatRoomId = generateChatRoomId(loggedInUser.uniqueId, currentChatUser.uniqueId);
            messageRef = chatDatabase.ref(`chats/${chatRoomId}/messages`).push();
            message.receiverId = currentChatUser.uniqueId;
            
            notifications.users[currentChatUser.uniqueId] = (notifications.users[currentChatUser.uniqueId] || 0) + 1;
        } else {
            throw new Error("No chat selected");
        }
        
        await messageRef.set(message);
        console.log("Message sent successfully");
        
        // Clear inputs
        chatElements.messageInput.value = '';
        removeImagePreview();
        clearReply();
        
        // Update notifications
        updateNotifications();
        updateNavNotifications();
        
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
    } finally {
        // Restore button
        chatElements.sendBtn.innerHTML = originalBtnHTML;
        chatElements.sendBtn.disabled = false;
        chatElements.messageInput.focus();
    }
}

// Extract mentions from text - IMPROVED VERSION
function extractMentions(text) {
    if (!text) return [];
    
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    const uniqueCheck = new Set();
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
        const mentionedName = match[1];
        
        // Find user by name or username (case-insensitive)
        const mentionedUser = chatUsers.find(u => 
            u.name.toLowerCase().includes(mentionedName.toLowerCase()) ||
            (u.username && u.username.toLowerCase().includes(mentionedName.toLowerCase()))
        );
        
        if (mentionedUser && !uniqueCheck.has(mentionedUser.uniqueId)) {
            mentions.push({
                id: mentionedUser.uniqueId,
                name: mentionedUser.name
            });
            uniqueCheck.add(mentionedUser.uniqueId);
        }
    }
    
    return mentions;
}

// Show mention dropdown - FIXED VERSION
function showMentionDropdown() {
    if (!currentChatUser && !currentGroup) {
        alert("Please select a chat first!");
        return;
    }
    
    // Create dropdown if it doesn't exist
    let dropdown = document.getElementById('mentionDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'mentionDropdown';
        dropdown.className = 'mention-dropdown';
        document.body.appendChild(dropdown);
    }
    
    dropdown.innerHTML = '';
    
    let usersToShow = [];
    
    if (isGroupChat && currentGroup) {
        currentGroup.members.forEach(memberId => {
            if (memberId !== loggedInUser.uniqueId) {
                const user = chatUsers.find(u => u.uniqueId === memberId);
                if (user) usersToShow.push(user);
            }
        });
    } else if (currentChatUser) {
        usersToShow.push(currentChatUser);
    }
    
    if (usersToShow.length === 0) {
        dropdown.innerHTML = '<div class="mention-item no-mentions">No users available to mention</div>';
    } else {
        usersToShow.forEach(user => {
            const item = document.createElement('div');
            item.className = 'mention-item';
            item.innerHTML = `
                <div class="user-avatar vip" style="width: 30px; height: 30px; font-size: 14px;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <span>${user.name}</span>
            `;
            
            item.addEventListener('click', () => {
                insertMention(user.name);
                dropdown.style.display = 'none';
            });
            
            dropdown.appendChild(item);
        });
    }
    
    // Position dropdown properly
    if (dropdown.children.length > 0) {
        const rect = chatElements.messageInput.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.bottom = `${window.innerHeight - rect.top + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.maxHeight = '200px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.display = 'block';
        dropdown.style.zIndex = '1000';
        
        // Bring to front
        dropdown.style.transform = 'translateZ(0)';
    }
}

// Insert mention into input
function insertMention(username) {
    const input = chatElements.messageInput;
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(cursorPos);
    
    // Check if we're already typing @
    const lastAtPos = textBefore.lastIndexOf('@');
    if (lastAtPos !== -1 && !textBefore.substring(lastAtPos + 1).includes(' ')) {
        // Replace the partial mention
        input.value = textBefore.substring(0, lastAtPos) + `@${username} ` + textAfter;
        input.focus();
        input.selectionStart = input.selectionEnd = lastAtPos + username.length + 2;
    } else {
        // Add new mention
        input.value = textBefore + `@${username} ` + textAfter;
        input.focus();
        input.selectionStart = input.selectionEnd = cursorPos + username.length + 2;
    }
}

// Upload image
function uploadImage() {
    if (!currentChatUser && !currentGroup) {
        alert("Please select a chat first!");
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        selectedImage = file;
        showImagePreview(file);
    };
    
    input.click();
}

// Show image preview
function showImagePreview(file) {
    removeImagePreview();
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview = document.createElement('div');
        imagePreview.className = 'image-preview';
        imagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <div style="margin-top: 10px;">
                <span style="font-size: 12px; color: #666;">${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button class="remove-image" onclick="removeImagePreview()" style="margin-left: 10px;">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        `;
        
        const inputArea = document.querySelector('.message-input-area');
        if (inputArea) {
            inputArea.insertBefore(imagePreview, document.querySelector('.input-tools'));
        }
    };
    
    reader.readAsDataURL(file);
}

// Remove image preview
function removeImagePreview() {
    if (imagePreview) {
        imagePreview.remove();
        imagePreview = null;
        selectedImage = null;
    }
}

// Show group management
function showGroupManagement() {
    if (!currentGroup) return;
    
    const modal = document.getElementById('groupManageModalOverlay');
    const content = document.getElementById('groupManageContent');
    const isAdmin = currentGroup.admin === loggedInUser.uniqueId;
    
    content.innerHTML = `
        <h4>${currentGroup.name}</h4>
        <p><strong>Created:</strong> ${new Date(currentGroup.created).toLocaleDateString()}</p>
        <p><strong>Admin:</strong> ${getSenderName(currentGroup.admin)}</p>
        <p><strong>Members (${currentGroup.members.length}):</strong></p>
        
        <div class="members-management-list">
            ${currentGroup.members.map(memberId => {
                const isMemberAdmin = memberId === currentGroup.admin;
                const isCurrentUser = memberId === loggedInUser.uniqueId;
                return `
                    <div class="member-management-item" data-member-id="${memberId}">
                        <div class="member-info">
                            <div class="user-avatar vip" style="width: 35px; height: 35px; font-size: 16px;">
                                ${getSenderName(memberId).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong>${getSenderName(memberId)}</strong>
                                <div style="display: flex; gap: 10px; font-size: 12px; color: #666;">
                                    <span>${isMemberAdmin ? '👑 Admin' : '👤 Member'}</span>
                                    <span>${activeUsers[memberId]?.status === 'online' ? '🟢 Online' : '⚫ Offline'}</span>
                                </div>
                            </div>
                        </div>
                        ${isAdmin && !isMemberAdmin && !isCurrentUser ? `
                            <button class="btn-remove-member" data-member-id="${memberId}">
                                <i class="fas fa-user-minus"></i> Remove
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
        
        ${isAdmin ? `
            <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                <h5>Add New Members</h5>
                <div id="availableMembersList" class="available-members-list"></div>
                <button class="btn" id="addMembersBtn" style="margin-top: 10px;">
                    <i class="fas fa-user-plus"></i> Add Selected Members
                </button>
            </div>
        ` : ''}
    `;
    
    modal.style.display = 'flex';
    
    if (isAdmin) {
        loadAvailableMembers();
    }
    
    setTimeout(() => {
        document.querySelectorAll('.btn-remove-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = e.target.closest('.btn-remove-member').dataset.memberId;
                removeMemberFromGroup(memberId);
            });
        });
        
        const addMembersBtn = document.getElementById('addMembersBtn');
        if (addMembersBtn) {
            addMembersBtn.addEventListener('click', addSelectedMembers);
        }
    }, 100);
}

// Load available members
function loadAvailableMembers() {
    const availableList = document.getElementById('availableMembersList');
    if (!availableList) return;
    
    const availableMembers = chatUsers.filter(user => 
        !currentGroup.members.includes(user.uniqueId)
    );
    
    if (availableMembers.length === 0) {
        availableList.innerHTML = '<p style="color: #666; font-style: italic;">No available VIP members to add</p>';
        return;
    }
    
    availableList.innerHTML = '';
    
    availableMembers.forEach(user => {
        const memberItem = document.createElement('div');
        memberItem.className = 'available-member-item';
        memberItem.innerHTML = `
            <input type="checkbox" id="avail-${user.uniqueId}" value="${user.uniqueId}" class="member-checkbox">
            <label for="avail-${user.uniqueId}">
                <div class="user-avatar vip" style="width: 30px; height: 30px; font-size: 14px;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <span>${user.name}</span>
                <span style="font-size: 12px; color: #666; margin-left: auto;">
                    ${activeUsers[user.uniqueId]?.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                </span>
            </label>
        `;
        availableList.appendChild(memberItem);
    });
}

// Remove member from group
async function removeMemberFromGroup(memberId) {
    if (!currentGroup || !confirm(`Remove ${getSenderName(memberId)} from group?`)) return;
    
    try {
        const updatedMembers = currentGroup.members.filter(id => id !== memberId);
        
        await chatDatabase.ref(`groups/${currentGroup.id}`).update({
            members: updatedMembers
        });
        
        currentGroup.members = updatedMembers;
        alert(`${getSenderName(memberId)} removed from group.`);
        showGroupManagement();
        loadGroups();
        
    } catch (error) {
        console.error("Error removing member:", error);
        alert("Failed to remove member.");
    }
}

// Add selected members to group
async function addSelectedMembers() {
    if (!currentGroup) return;
    
    const selectedCheckboxes = document.querySelectorAll('.member-checkbox:checked');
    const selectedMemberIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedMemberIds.length === 0) {
        alert("Please select members to add.");
        return;
    }
    
    try {
        const updatedMembers = [...currentGroup.members, ...selectedMemberIds];
        const uniqueMembers = [...new Set(updatedMembers)];
        
        await chatDatabase.ref(`groups/${currentGroup.id}`).update({
            members: uniqueMembers
        });
        
        currentGroup.members = uniqueMembers;
        alert(`${selectedMemberIds.length} member(s) added.`);
        showGroupManagement();
        loadGroups();
        
    } catch (error) {
        console.error("Error adding members:", error);
        alert("Failed to add members.");
    }
}

// Clear chat (delete all messages for current user only)
async function clearChat() {
    if (!confirm('Clear all messages from your view? This will not delete messages for others.')) return;
    
    try {
        if (isGroupChat && currentGroup) {
            // Mark all messages as deleted for current user
            const snapshot = await chatDatabase.ref(`groupChats/${currentGroup.id}/messages`).once('value');
            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(child => {
                    updates[`${child.key}/deleted`] = true;
                    updates[`${child.key}/deletedAt`] = Date.now();
                    updates[`${child.key}/deletedBy`] = loggedInUser.uniqueId;
                    updates[`${child.key}/deletedFor`] = loggedInUser.uniqueId;
                });
                await chatDatabase.ref(`groupChats/${currentGroup.id}/messages`).update(updates);
            }
        } else if (currentChatUser) {
            const chatRoomId = generateChatRoomId(loggedInUser.uniqueId, currentChatUser.uniqueId);
            const snapshot = await chatDatabase.ref(`chats/${chatRoomId}/messages`).once('value');
            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(child => {
                    updates[`${child.key}/deleted`] = true;
                    updates[`${child.key}/deletedAt`] = Date.now();
                    updates[`${child.key}/deletedBy`] = loggedInUser.uniqueId;
                    updates[`${child.key}/deletedFor`] = loggedInUser.uniqueId;
                });
                await chatDatabase.ref(`chats/${chatRoomId}/messages`).update(updates);
            }
        }
        alert("Chat cleared from your view!");
    } catch (error) {
        console.error("Error clearing chat:", error);
        alert("Failed to clear chat.");
    }
}

// Mark messages as read
function markMessagesAsRead(targetId, isGroup) {
    if (!chatDatabase) return;
    
    let messagesPath = isGroup ? 
        `groupChats/${targetId}/messages` : 
        `chats/${generateChatRoomId(loggedInUser.uniqueId, targetId)}/messages`;
    
    chatDatabase.ref(messagesPath).orderByChild('read').equalTo(false).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) return;
            
            const updates = {};
            snapshot.forEach(child => {
                if (child.val().senderId !== loggedInUser.uniqueId) {
                    updates[`${child.key}/read`] = true;
                }
            });
            
            if (Object.keys(updates).length > 0) {
                chatDatabase.ref(messagesPath).update(updates);
            }
        });
}

// Update notifications display
function updateNotifications() {
    document.querySelectorAll('.vip-user-item').forEach(item => {
        const uniqueId = item.dataset.uniqueId;
        const unreadCount = notifications.users[uniqueId] || 0;
        const badge = item.querySelector('.unread-count');
        
        if (unreadCount > 0) {
            if (!badge) {
                const newBadge = document.createElement('span');
                newBadge.className = 'unread-count';
                newBadge.textContent = unreadCount;
                item.appendChild(newBadge);
            } else {
                badge.textContent = unreadCount;
            }
        } else if (badge) {
            badge.remove();
        }
    });
    
    document.querySelectorAll('.group-item').forEach(item => {
        const groupId = item.dataset.groupId;
        const unreadCount = notifications.groups[groupId] || 0;
        const badge = item.querySelector('.unread-count');
        
        if (unreadCount > 0) {
            if (!badge) {
                const newBadge = document.createElement('span');
                newBadge.className = 'unread-count';
                newBadge.textContent = unreadCount;
                item.appendChild(newBadge);
            } else {
                badge.textContent = unreadCount;
            }
        } else if (badge) {
            badge.remove();
        }
    });
}

// Update nav notifications
function updateNavNotifications() {
    let totalUnread = 0;
    
    Object.values(notifications.users).forEach(count => totalUnread += count);
    Object.values(notifications.groups).forEach(count => totalUnread += count);
    
    const chatNavLink = document.querySelector('a[href="chat.html"]');
    if (chatNavLink) {
        const existingBadge = chatNavLink.querySelector('.nav-badge');
        
        if (totalUnread > 0) {
            if (existingBadge) {
                existingBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
            } else {
                const badge = document.createElement('span');
                badge.className = 'nav-badge';
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                chatNavLink.appendChild(badge);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    }
}

// Switch between tabs
function switchTab(tabName) {
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = content.id === `${tabName}List` ? 'block' : 'none';
    });
}

// Create new group
function createNewGroup() {
    const modal = document.getElementById('groupModalOverlay');
    const membersList = document.getElementById('groupMembersList');
    
    membersList.innerHTML = '';
    chatUsers.forEach(user => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-select-item';
        memberItem.innerHTML = `
            <input type="checkbox" id="member-${user.uniqueId}" value="${user.uniqueId}" class="group-member-checkbox">
            <label for="member-${user.uniqueId}">
                <div class="user-avatar vip" style="width: 30px; height: 30px; font-size: 14px;">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
                <span>${user.name}</span>
            </label>
        `;
        membersList.appendChild(memberItem);
    });
    
    modal.style.display = 'flex';
    
    document.getElementById('createGroupBtn').onclick = async () => {
        const groupName = document.getElementById('groupName').value.trim();
        if (!groupName) {
            alert('Enter group name');
            return;
        }
        
        const selectedMembers = Array.from(
            document.querySelectorAll('.group-member-checkbox:checked')
        ).map(cb => cb.value);
        
        if (selectedMembers.length === 0) {
            alert('Select at least one member');
            return;
        }
        
        try {
            const groupData = {
                name: groupName,
                admin: loggedInUser.uniqueId,
                members: [loggedInUser.uniqueId, ...selectedMembers],
                created: Date.now()
            };
            
            const newGroupRef = chatDatabase.ref('groups').push();
            await newGroupRef.set(groupData);
            
            groups.push({
                id: newGroupRef.key,
                ...groupData
            });
            
            displayGroups();
            modal.style.display = 'none';
            
            selectGroupChat({
                id: newGroupRef.key,
                ...groupData
            });
            
            alert(`Group "${groupName}" created!`);
            
        } catch (error) {
            console.error("Error creating group:", error);
            alert('Failed to create group.');
        }
    };
}

// Setup event listeners
function setupChatEventListeners() {
    // Send button
    if (chatElements.sendBtn) {
        chatElements.sendBtn.addEventListener('click', sendMessage);
    }
    
    // Enter key to send
    if (chatElements.messageInput) {
        chatElements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        chatElements.messageInput.addEventListener('focus', () => {
            if (!currentChatUser && !currentGroup) {
                chatElements.messageInput.blur();
                setTimeout(() => alert("Select a chat first!"), 100);
            }
        });
        
        // Auto-show mention dropdown when typing @
        chatElements.messageInput.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            const textBefore = e.target.value.substring(0, cursorPos);
            const lastChar = textBefore.charAt(cursorPos - 1);
            
            if (lastChar === '@') {
                showMentionDropdown();
            }
        });
    }
    
    // Upload image
    if (chatElements.uploadBtn) {
        chatElements.uploadBtn.addEventListener('click', uploadImage);
    }
    
    // Mention dropdown
    if (chatElements.mentionBtn) {
        chatElements.mentionBtn.addEventListener('click', showMentionDropdown);
    }
    
    // Tab switching
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Create group button
    const createGroupBtn = document.getElementById('createGroupBtnMain');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', createNewGroup);
    }
    
    // Window focus/blur for status
    window.addEventListener('focus', () => {
        if (loggedInUser && chatDatabase) {
            chatDatabase.ref(`userStatus/${loggedInUser.uniqueId}`).update({
                status: 'online',
                lastSeen: Date.now()
            });
        }
    });
    
    window.addEventListener('blur', () => {
        if (loggedInUser && chatDatabase) {
            chatDatabase.ref(`userStatus/${loggedInUser.uniqueId}`).update({
                status: 'idle',
                lastSeen: Date.now()
            });
        }
    });
    
    // Hide mention dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('mentionDropdown');
        if (dropdown && !dropdown.contains(e.target) && e.target !== chatElements.mentionBtn) {
            dropdown.style.display = 'none';
        }
    });
    
    // Handle @ key press
    document.addEventListener('keydown', (e) => {
        if (e.key === '@' && chatElements.messageInput === document.activeElement) {
            e.preventDefault();
            insertMention('');
            showMentionDropdown();
        }
    });
}

// Utility functions
function generateChatRoomId(userId1, userId2) {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
}

function getSenderName(senderId) {
    if (senderId === loggedInUser.uniqueId) return loggedInUser.name || loggedInUser.username;
    
    const user = chatUsers.find(u => u.uniqueId === senderId);
    return user ? user.name : `VIP ${senderId}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scrollToBottom() {
    if (chatElements.messagesContainer) {
        setTimeout(() => {
            chatElements.messagesContainer.scrollTop = chatElements.messagesContainer.scrollHeight;
        }, 100);
    }
}

function showNoUsersMessage() {
    const usersList = document.getElementById('vipUsersList');
    if (usersList) {
        usersList.innerHTML = '<div class="no-users-message"><p>No other VIP users found</p></div>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Chat page loaded, initializing...");
    initializeChat();
    
    // Handle mobile back button
    const mobileBackBtn = document.getElementById('mobileBackBtn');
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', closeChatOnMobile);
        mobileBackBtn.style.display = 'none';
    }
});

// Make functions available globally
window.removeImagePreview = removeImagePreview;
window.showFullImage = showFullImage;