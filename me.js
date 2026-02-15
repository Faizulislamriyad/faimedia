// me.js - Firebase v8 compatible version - COMPLETE UPDATED with New VIP Task System
// DOM Elements
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const switchToSignup = document.getElementById("switchToSignup");
const switchToLogin = document.getElementById("switchToLogin");

// Firebase configuration
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

// Initialize Firebase v8
let database;
let firebaseInitialized = false;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  database = firebase.database();
  firebaseInitialized = true;
  console.log("Firebase v8 initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  firebaseInitialized = false;
}

// Unique IDs with badges (8-digit numbers) - ALL VIP
const SPECIAL_IDS = {   
  "00191520": { type: "vip", name: "Shawon" },
  "20202020": { type: "vip", name: "Rifat" },      
  "00192621": { type: "vip", name: "Md. Al-Mamun Sarkar" },    
  "00193722": { type: "vip", name: "Tanvir" },  
  "59200311": { type: "vip", name: "Jewel" },       
  "60059500": { type: "vip", name: "Shakil" },    
  "52044379": { type: "vip", name: "Nayeem" },   
  "20529519": { type: "vip", name: "Arif" },
  "20202020": { type: "vip", name: "Demo" },
  "50522654": { type: "vip", name: "Anika" }
};

const BADGE_CONFIG = {
  "vip": { 
    text: "VIP", 
    color: "#FFD700",
    icon: "fas fa-crown"
  },
  "regular": { 
    text: "User", 
    color: "#6c757d", 
    icon: "fas fa-user"
  }
};

// User state
let currentUser = null;
let checkDeadlineInterval;

// VIP Member Cache
let vipMemberCache = {};

// Initialize VIP Member Cache
function initializeVipMemberCache() {
  Object.keys(SPECIAL_IDS).forEach(uniqueId => {
    vipMemberCache[uniqueId] = {
      name: SPECIAL_IDS[uniqueId].name,
      uniqueId: uniqueId,
      type: "vip"
    };
  });
}

// Get VIP Member Name (with fallback to number)
async function getVipMemberDisplayName(uniqueId, useNumberAsFallback = true) {
  // First check cache
  if (vipMemberCache[uniqueId]) {
    return vipMemberCache[uniqueId].name || (useNumberAsFallback ? uniqueId : "Unknown VIP");
  }
  
  // If not in cache, check Firebase for real name
  try {
    const snapshot = await database.ref('users')
      .orderByChild('uniqueId')
      .equalTo(uniqueId)
      .once('value');
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const user = Object.values(users)[0];
      if (user && user.name) {
        // Update cache
        vipMemberCache[uniqueId] = {
          name: user.name,
          uniqueId: uniqueId,
          type: "vip"
        };
        return user.name;
      }
    }
  } catch (error) {
    console.error("Error fetching VIP member name:", error);
  }
  
  // Return default name from SPECIAL_IDS or fallback to number
  const defaultName = SPECIAL_IDS[uniqueId]?.name;
  if (defaultName) {
    vipMemberCache[uniqueId] = {
      name: defaultName,
      uniqueId: uniqueId,
      type: "vip"
    };
    return defaultName;
  }
  
  return useNumberAsFallback ? uniqueId : "Unknown VIP";
}

// Get VIP Member Name for Sender (for task display)
async function getVipSenderDisplayName(senderId) {
  // Check if sender is the current user
  if (currentUser && currentUser.uniqueId === senderId) {
    return currentUser.name || currentUser.username || senderId;
  }
  
  // Try to get from cache or Firebase
  return await getVipMemberDisplayName(senderId, true);
}

// Switch to Login Form
function showLoginForm() {
  if (loginForm && signupForm) {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    if (loginTab) loginTab.classList.add("active");
    if (signupTab) signupTab.classList.remove("active");
    resetForms();
  }
}

// Switch to Signup Form
function showSignupForm() {
  if (loginForm && signupForm) {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
    if (signupTab) signupTab.classList.add("active");
    if (loginTab) loginTab.classList.remove("active");
    resetForms();
  }
}

// Reset form messages and validation
function resetForms() {
  const elements = ["loginError", "loginSuccess", "signupError", "signupSuccess", "passwordMatch"];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.textContent = "";
    }
  });

  const passwordStrength = document.getElementById("passwordStrength");
  if (passwordStrength) {
    passwordStrength.style.width = "0";
  }
}

// Password visibility toggle functions
function setupPasswordToggles() {
  const loginPasswordToggle = document.getElementById("loginPasswordToggle");
  const loginPassword = document.getElementById("loginPassword");
  const passwordToggle = document.getElementById("passwordToggle");
  const password = document.getElementById("password");
  const confirmPasswordToggle = document.getElementById("confirmPasswordToggle");
  const confirmPassword = document.getElementById("confirmPassword");

  if (loginPasswordToggle && loginPassword) {
    loginPasswordToggle.addEventListener("click", () => {
      const type = loginPassword.getAttribute("type") === "password" ? "text" : "password";
      loginPassword.setAttribute("type", type);
      loginPasswordToggle.innerHTML = type === "password" 
        ? '<i class="fas fa-eye"></i>' 
        : '<i class="fas fa-eye-slash"></i>';
    });
  }

  if (passwordToggle && password) {
    passwordToggle.addEventListener("click", () => {
      const type = password.getAttribute("type") === "password" ? "text" : "password";
      password.setAttribute("type", type);
      passwordToggle.innerHTML = type === "password" 
        ? '<i class="fas fa-eye"></i>' 
        : '<i class="fas fa-eye-slash"></i>';
    });
  }

  if (confirmPasswordToggle && confirmPassword) {
    confirmPasswordToggle.addEventListener("click", () => {
      const type = confirmPassword.getAttribute("type") === "password" ? "text" : "password";
      confirmPassword.setAttribute("type", type);
      confirmPasswordToggle.innerHTML = type === "password" 
        ? '<i class="fas fa-eye"></i>' 
        : '<i class="fas fa-eye-slash"></i>';
    });
  }
}

// Password strength checker
function setupPasswordStrengthChecker() {
  const password = document.getElementById("password");
  const passwordStrength = document.getElementById("passwordStrength");

  if (password && passwordStrength) {
    password.addEventListener("input", function () {
      const strength = checkPasswordStrength(this.value);
      updateStrengthMeter(strength);
    });
  }
}

function checkPasswordStrength(pwd) {
  if (!pwd) return 0;
  let strength = 0;
  if (pwd.length >= 6) strength++;
  if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
  if (pwd.match(/\d/)) strength++;
  if (pwd.match(/[^a-zA-Z\d]/)) strength++;
  return strength;
}

function updateStrengthMeter(strength) {
  const passwordStrength = document.getElementById("passwordStrength");
  if (!passwordStrength) return;
  
  const strengthColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71"];
  const widthPercent = strength * 25;
  passwordStrength.style.width = `${widthPercent}%`;
  passwordStrength.style.backgroundColor = strengthColors[strength - 1] || "#e74c3c";
}

// Confirm password validation
function setupPasswordValidation() {
  const confirmPassword = document.getElementById("confirmPassword");
  const password = document.getElementById("password");

  if (confirmPassword && password) {
    confirmPassword.addEventListener("input", function () {
      const passwordMatch = document.getElementById("passwordMatch");
      if (!passwordMatch) return;
      
      if (this.value !== password.value) {
        passwordMatch.textContent = "Passwords don't match";
        passwordMatch.style.display = "block";
      } else {
        passwordMatch.style.display = "none";
      }
    });
  }
}

// Firebase v8 Functions
function checkUserExists(username, uniqueId = null) {
  return new Promise((resolve) => {
    if (!database) {
      console.error("Database not initialized");
      resolve(false);
      return;
    }
    
    database.ref('users').once('value')
      .then((snapshot) => {
        if (!snapshot.exists()) {
          resolve(false);
          return;
        }
        
        const users = snapshot.val();
        let exists = false;
        
        for (let id in users) {
          const user = users[id];
          if (user.username === username) {
            exists = true;
            break;
          }
          if (uniqueId && user.uniqueId && user.uniqueId === uniqueId) {
            exists = true;
            break;
          }
        }
        
        resolve(exists);
      })
      .catch((error) => {
        console.error("Error checking user:", error);
        resolve(false);
      });
  });
}

function saveUserToFirebase(userData) {
  return new Promise((resolve) => {
    if (!database) {
      resolve({ success: false, error: "Database not initialized" });
      return;
    }
    
    const newUserRef = database.ref('users').push();
    const userId = newUserRef.key;
    
    const userWithId = {
      ...userData,
      id: userId,
      joinedDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      views: 0,
      likes: 0,
      loginCount: 1,
      achievements: {
        firstLogin: true,
        accountCreated: true
      }
    };
    
    newUserRef.set(userWithId)
      .then(() => {
        resolve({ success: true, userId: userId });
      })
      .catch((error) => {
        console.error("Error saving user:", error);
        resolve({ success: false, error: error.message });
      });
  });
}

function authenticateUser(username, password) {
  return new Promise((resolve) => {
    if (!database) {
      console.error("Database not initialized");
      resolve(null);
      return;
    }
    
    database.ref('users').once('value')
      .then((snapshot) => {
        if (!snapshot.exists()) {
          resolve(null);
          return;
        }
        
        const users = snapshot.val();
        let foundUser = null;
        let userKey = null;
        
        for (let id in users) {
          const user = users[id];
          if ((user.username === username || user.uniqueId === username) && 
              user.password === password) {
            foundUser = user;
            userKey = id;
            break;
          }
        }
        
        if (foundUser) {
          const updates = {
            lastLogin: new Date().toISOString(),
            loginCount: (foundUser.loginCount || 0) + 1
          };
          
          database.ref('users/' + userKey).update(updates)
            .then(() => {
              resolve({ ...foundUser, firebaseId: userKey });
            })
            .catch((error) => {
              console.error("Error updating login:", error);
              resolve({ ...foundUser, firebaseId: userKey });
            });
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        console.error("Error authenticating:", error);
        resolve(null);
      });
  });
}

function updateUserStats(userId) {
  if (!database) return Promise.resolve();
  
  return new Promise((resolve) => {
    database.ref('users/' + userId).once('value')
      .then((snapshot) => {
        if (snapshot.exists()) {
          const user = snapshot.val();
          const newViews = (user.views || 0) + Math.floor(Math.random() * 10) + 1;
          const newLikes = (user.likes || 0) + Math.floor(Math.random() * 5);
          
          const updates = {
            views: newViews,
            likes: newLikes,
            lastActive: new Date().toISOString()
          };
          
          database.ref('users/' + userId).update(updates)
            .then(() => resolve())
            .catch((error) => {
              console.error("Error updating stats:", error);
              resolve();
            });
        } else {
          resolve();
        }
      })
      .catch((error) => {
        console.error("Error getting user:", error);
        resolve();
      });
  });
}

// ==================== UPDATED VIP TASK SYSTEM FUNCTIONS ====================

// Setup VIP Task System - শুধু যারা টাস্ক সেন্ড করতে পারবে
function setupVIPTaskSystemForSenders(userData) {
  const canSendTasks = ["00191520", "00192621", "00193722"];
  const userUniqueId = userData.uniqueId;
  
  if (!canSendTasks.includes(userUniqueId)) {
    return; // শুধু প্রথম 3 VIP টাস্ক সেন্ড করতে পারবে
  }
  
  // Add Task Sending Section to Dashboard
  const dashboardContent = document.querySelector('.dashboard-content');
  if (!dashboardContent) return;
  
  // Create VIP Task Section HTML (টাস্ক সেন্ড করার জন্য)
  const vipTaskSection = document.createElement('div');
  vipTaskSection.className = 'content-section vip-task-section';
  vipTaskSection.innerHTML = `
    <h3><i class="fas fa-paper-plane"></i> Send Task to VIP Members</h3>
    <p style="color: #666; margin-bottom: 15px;">You can send tasks to other VIP members</p>
    
    <div class="form-group">
      <label for="taskReceiver">Select VIP Member:</label>
      <select id="taskReceiver" class="task-receiver-select">
        <option value="">Select a VIP member...</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="taskTitle">Task Title:</label>
      <input type="text" id="taskTitle" placeholder="Enter task title" maxlength="100">
    </div>
    
    <div class="form-group">
      <label for="taskDescription">Task Description:</label>
      <div style="position: relative;">
        <textarea id="taskDescription" placeholder="Enter task details..." rows="6" style="width: 100%;"></textarea>
        <div id="taskDescriptionCounter" style="text-align: right; font-size: 12px; color: #666; margin-top: 5px;">
          Characters: <span id="taskDescriptionCharCount">0</span>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label for="taskPriority">Priority:</label>
      <select id="taskPriority">
        <option value="low">Low</option>
        <option value="medium" selected>Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="taskDeadline">Deadline (Optional):</label>
      <input type="date" id="taskDeadline">
    </div>
    
    <button class="btn vip-task-btn" id="sendTaskBtn">
      <i class="fas fa-paper-plane"></i> Send Task
    </button>
    
    <div id="taskSendSuccess" class="success-message" style="margin-top: 15px;"></div>
    <div id="taskSendError" class="error-message" style="margin-top: 15px;"></div>
  `;
  
  // Insert after the Support button section
  const supportSection = document.querySelector('.content-section:last-child');
  if (supportSection) {
    dashboardContent.insertBefore(vipTaskSection, supportSection);
  } else {
    dashboardContent.appendChild(vipTaskSection);
  }
  
  // Setup character counter for task description
  setupTaskDescriptionCounter();
  
  // Load VIP members list
  loadVIPMembers();
  
  // Add event listener for send button
  document.getElementById('sendTaskBtn').addEventListener('click', () => {
    sendTaskToVIP(userUniqueId);
  });
}

// Setup character counter for task description
function setupTaskDescriptionCounter() {
  const taskDescription = document.getElementById('taskDescription');
  const charCountElement = document.getElementById('taskDescriptionCharCount');
  
  if (taskDescription && charCountElement) {
    // Initial count
    charCountElement.textContent = taskDescription.value.length;
    
    // Update count on input
    taskDescription.addEventListener('input', function() {
      charCountElement.textContent = this.value.length;
    });
  }
}

// Setup VIP Task System - শুধু যারা টাস্ক রিসিভ করতে পারবে
function setupVIPTaskSystemForReceivers(userData) {
  const userUniqueId = userData.uniqueId;
  
  // শুধু যারা টাস্ক সেন্ড করতে পারে না (তারা শুধু রিসিভ করবে)
  const canSendTasks = ["00191520", "00192621", "00193722"];
  if (canSendTasks.includes(userUniqueId)) {
    return; // যারা সেন্ড করতে পারে তাদের জন্য আলাদা সেকশন
  }
  
  // Add Received Tasks Section to Dashboard
  const dashboardContent = document.querySelector('.dashboard-content');
  if (!dashboardContent) return;
  
  // Create Received Tasks Section HTML
  const receivedTaskSection = document.createElement('div');
  receivedTaskSection.className = 'content-section vip-received-tasks-section';
  receivedTaskSection.innerHTML = `
    <h3><i class="fas fa-tasks"></i> Your VIP Tasks</h3>
    <p style="color: #666; margin-bottom: 15px;">Tasks sent by VIP members</p>
    
    <div id="receivedTasksContainer" class="received-tasks-container">
      <p style="text-align: center; color: #888; padding: 20px;">Loading tasks...</p>
    </div>
  `;
  
  // Insert after the Support button section
  const supportSection = document.querySelector('.content-section:last-child');
  if (supportSection) {
    dashboardContent.insertBefore(receivedTaskSection, supportSection);
  } else {
    dashboardContent.appendChild(receivedTaskSection);
  }
  
  // Load received tasks
  loadAndDisplayReceivedTasks(userUniqueId);
}

async function loadVIPMembers() {
  const selectElement = document.getElementById('taskReceiver');
  if (!selectElement) return;
  
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
  
  // Get all VIP IDs except the current user
  const vipIds = Object.keys(SPECIAL_IDS);
  
  for (const uniqueId of vipIds) {
    // Skip the current user if they're in the senders list
    if (["00191520", "00192621", "00193722"].includes(uniqueId)) continue;
    
    const option = document.createElement('option');
    option.value = uniqueId;
    
    // Try to get name from cache or Firebase
    const displayName = await getVipMemberDisplayName(uniqueId, false);
    option.textContent = displayName;
    
    selectElement.appendChild(option);
  }
}

async function sendTaskToVIP(senderId) {
  const receiverId = document.getElementById('taskReceiver').value;
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const deadline = document.getElementById('taskDeadline').value;
  
  const successMsg = document.getElementById('taskSendSuccess');
  const errorMsg = document.getElementById('taskSendError');
  
  // Validation
  if (!receiverId) {
    errorMsg.textContent = "Please select a VIP member";
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
    return;
  }
  
  if (!title || title.length < 3) {
    errorMsg.textContent = "Task title must be at least 3 characters";
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
    return;
  }
  
  if (!description || description.length < 10) {
    errorMsg.textContent = "Task description must be at least 10 characters";
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
    return;
  }
  
  // Unlimited description check - no maximum limit
  if (description.length > 10000) { // Very high limit instead of restriction
    console.log("Long description detected: " + description.length + " characters");
    // Allow it, just show a warning
    if (!confirm("This task description is very long (" + description.length + " characters). Are you sure you want to send it?")) {
      return;
    }
  }
  
  try {
    const taskData = {
      senderId,
      receiverId,
      title,
      description,
      priority,
      deadline: deadline || null,
      timestamp: new Date().toISOString(),
      status: 'pending',
      done: false,
      deleted: false
    };
    
    // Save to Firebase
    const newTaskRef = database.ref('vipTasks').push();
    await newTaskRef.set(taskData);
    
    // Success message
    successMsg.textContent = "Task sent successfully!";
    successMsg.style.display = "block";
    errorMsg.style.display = "none";
    
    // Clear form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDeadline').value = '';
    
    // Reset character counter
    const charCountElement = document.getElementById('taskDescriptionCharCount');
    if (charCountElement) {
      charCountElement.textContent = '0';
    }
    
    // Auto hide success message
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 3000);
    
  } catch (error) {
    console.error("Error sending task:", error);
    errorMsg.textContent = "Failed to send task. Please try again.";
    errorMsg.style.display = "block";
    successMsg.style.display = "none";
  }
}

// FIXED: Added null check for tasksContainer
async function loadAndDisplayReceivedTasks(receiverId) {
  if (!database) return;
  
  // First check if container exists
  const tasksContainer = document.getElementById('receivedTasksContainer');
  if (!tasksContainer) {
    console.log("No received tasks container found for user", receiverId);
    return; // Exit if container doesn't exist
  }
  
  try {
    const snapshot = await database.ref('vipTasks')
      .orderByChild('receiverId')
      .equalTo(receiverId)
      .once('value');
    
    if (!snapshot.exists()) {
      tasksContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No tasks received yet</p>';
      return;
    }
    
    const tasks = snapshot.val();
    tasksContainer.innerHTML = '';
    
    // Check deadlines and auto-delete expired tasks
    await checkAndDeleteExpiredTasks(tasks);
    
    // Filter out deleted tasks
    const activeTasks = Object.keys(tasks)
      .map(id => ({ id, ...tasks[id] }))
      .filter(task => !task.deleted)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (activeTasks.length === 0) {
      tasksContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No active tasks</p>';
      return;
    }
    
    // Create task elements with sender names
    for (const task of activeTasks) {
      const taskElement = await createReceivedTaskElement(task);
      tasksContainer.appendChild(taskElement);
    }
    
  } catch (error) {
    console.error("Error loading received tasks:", error);
    tasksContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Error loading tasks</p>';
  }
}

async function createReceivedTaskElement(task) {
  const div = document.createElement('div');
  div.className = 'received-task-item';
  div.id = `task-${task.id}`;
  
  const priorityColors = {
    'low': '#28a745',
    'medium': '#17a2b8',
    'high': '#ffc107',
    'urgent': '#dc3545'
  };
  
  const priorityText = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  
  const date = new Date(task.timestamp);
  const formattedDate = date.toLocaleDateString();
  
  // Get sender display name
  const senderDisplayName = await getVipSenderDisplayName(task.senderId);
  
  // Check if task is done
  if (task.done) {
    div.className += ' task-done';
    div.innerHTML = `
      <div class="task-header">
        <h4><i class="fas fa-check-circle" style="color: #28a745;"></i> ${task.title}</h4>
        <span class="task-status-done">Completed</span>
      </div>
      <div class="task-simple-view">
        <p>Task completed</p>
      </div>
    `;
    return div;
  }
  
  // Check deadline
  let deadlineWarning = '';
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    const timeDiff = deadlineDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) {
      deadlineWarning = '<span class="deadline-expired">EXPIRED</span>';
    } else if (daysDiff <= 3) {
      deadlineWarning = `<span class="deadline-soon">${daysDiff} days left</span>`;
    }
  }
  
  // Format description with proper line breaks
  const formattedDescription = task.description
    .replace(/\n/g, '<br>')
    .replace(/\r/g, '');
  
  div.innerHTML = `
    <div class="task-header">
      <h4>${task.title}</h4>
      <div class="task-header-right">
        <span class="task-priority" style="background: ${priorityColors[task.priority]}">${priorityText[task.priority]}</span>
        ${deadlineWarning}
      </div>
    </div>
    <div class="task-body">
      <div class="task-description" style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;">
        ${formattedDescription}
      </div>
      <div class="task-footer">
        <div class="task-info">
          <span class="task-sender"><i class="fas fa-user"></i> From: ${senderDisplayName}</span>
          <span class="task-date"><i class="fas fa-calendar"></i> ${formattedDate}</span>
          ${task.deadline ? `<span class="task-deadline"><i class="fas fa-clock"></i> Deadline: ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
        </div>
        <div class="task-actions">
          <button class="task-done-btn" data-task-id="${task.id}">
            <i class="fas fa-check"></i> Done
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add event listener for done button
  const doneBtn = div.querySelector('.task-done-btn');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      markTaskAsDone(task.id, task.receiverId);
    });
  }
  
  return div;
}

async function markTaskAsDone(taskId, receiverId) {
  if (!database) return;
  
  try {
    // Mark task as done
    await database.ref(`vipTasks/${taskId}`).update({
      done: true,
      doneAt: new Date().toISOString()
    });
    
    // Update UI
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
      taskElement.innerHTML = `
        <div class="task-header">
          <h4><i class="fas fa-check-circle" style="color: #28a745;"></i> ${taskElement.querySelector('h4').textContent}</h4>
          <span class="task-status-done">Completed</span>
        </div>
        <div class="task-simple-view">
          <p>Task completed</p>
        </div>
      `;
      taskElement.className += ' task-done';
    }
    
    // Reload tasks after 2 seconds
    setTimeout(() => {
      loadAndDisplayReceivedTasks(receiverId);
    }, 2000);
    
  } catch (error) {
    console.error("Error marking task as done:", error);
    alert("Failed to mark task as done. Please try again.");
  }
}

async function checkAndDeleteExpiredTasks(tasks) {
  if (!database) return;
  
  const today = new Date();
  let deletedCount = 0;
  
  for (const taskId in tasks) {
    const task = tasks[taskId];
    
    // Skip already deleted tasks
    if (task.deleted) continue;
    
    // Check if task has deadline and it's expired
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      if (deadlineDate < today && !task.done) {
        // Auto delete expired tasks
        try {
          await database.ref(`vipTasks/${taskId}`).update({
            deleted: true,
            deletedAt: new Date().toISOString(),
            deletedReason: 'deadline_expired'
          });
          deletedCount++;
        } catch (error) {
          console.error("Error deleting expired task:", error);
        }
      }
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Auto-deleted ${deletedCount} expired tasks`);
  }
}

// FIXED: Added container check before loading tasks
function startDeadlineChecker() {
  if (checkDeadlineInterval) {
    clearInterval(checkDeadlineInterval);
  }
  
  checkDeadlineInterval = setInterval(() => {
    if (currentUser && currentUser.uniqueId) {
      const tasksContainer = document.getElementById('receivedTasksContainer');
      if (tasksContainer) {
        // Only load tasks if container exists
        loadAndDisplayReceivedTasks(currentUser.uniqueId);
      }
    }
  }, 60000); // Check every minute
}

// ==================== DASHBOARD FUNCTIONS ====================

function showDashboard(userData) {
  currentUser = userData;
  
  // Update VIP member cache with current user's name
  if (userData.uniqueId && SPECIAL_IDS[userData.uniqueId]) {
    vipMemberCache[userData.uniqueId] = {
      name: userData.name || userData.username,
      uniqueId: userData.uniqueId,
      type: "vip"
    };
  }
  
  // Hide login section
  const loginSection = document.querySelector('.login-section');
  if (loginSection) {
    loginSection.style.display = 'none';
  }
  
  // Show dashboard section
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection) {
    dashboardSection.style.display = 'block';
    updateDashboardData(userData);
    setupDashboardListeners();
    
    // Update navigation menu based on user type
    updateNavigationMenu(userData);
    
    // Check if user is VIP
    if (userData.uniqueId && SPECIAL_IDS[userData.uniqueId]) {
      // For the first 3 VIPs who can send tasks
      if (["00191520", "00192621", "00193722"].includes(userData.uniqueId)) {
        setupVIPTaskSystemForSenders(userData);
      } else {
        // For VIP users who can only receive tasks
        setupVIPTaskSystemForReceivers(userData);
        // Start deadline checker only for receivers
        startDeadlineChecker();
      }
    }
  }
}

// Update navigation menu based on user type
function updateNavigationMenu(userData) {
  const navList = document.querySelector('.nav-list');
  if (!navList) return;
  
  const isVipUser = userData.uniqueId && SPECIAL_IDS[userData.uniqueId];
  
  // Find the current "Me" link (which is active in me.html)
  const currentMeLink = document.querySelector('.nav-list a.active');
  const currentMeLi = currentMeLink ? currentMeLink.parentElement : null;
  
  if (isVipUser) {
    // Check if chat link already exists
    let chatLink = document.querySelector('a[href="chat.html"]');
    
    if (!chatLink) {
      // Create new chat link for VIP users
      const chatLi = document.createElement('li');
      chatLi.innerHTML = `
        <a href="chat.html" class="nav-link">
          <i class="fa-solid fa-comments"></i>
        </a>
      `;
      
      // Insert chat link after the "Me" link
      if (currentMeLi && currentMeLi.nextElementSibling) {
        navList.insertBefore(chatLi, currentMeLi.nextElementSibling);
      } else {
        navList.appendChild(chatLi);
      }
      
      console.log("VIP Chat link added for user:", userData.uniqueId);
    }
  } else {
    // Regular user - remove chat link if exists
    const chatLi = document.querySelector('li a[href="chat.html"]')?.parentElement;
    if (chatLi) {
      chatLi.remove();
      console.log("Chat link removed for regular user");
    }
  }
}

function updateDashboardData(userData) {
  const usernameEl = document.getElementById('dashboardUsername');
  if (usernameEl) {
    let isVipUser = false;
    if (userData.uniqueId && SPECIAL_IDS[userData.uniqueId]) {
      isVipUser = true;
    }
    
    // Show name instead of username for VIP users
    const displayName = userData.name || userData.username;
    usernameEl.innerHTML = `Welcome, ${displayName}!`;
  }
  
  const isVipUser = userData.uniqueId && SPECIAL_IDS[userData.uniqueId];
  
  const detailFields = {
    'detailName': userData.name || 'Not set',
    'detailEmail': userData.email || 'Not set',
    'detailUsername': userData.username || 'Not set',
    'detailUniqueId': userData.uniqueId || 'Not set',
    'detailBirthDate': userData.birthDate || 'Not set',
    'detailType': isVipUser ? 'VIP User' : 'Regular User',
    'detailLastLogin': new Date(userData.lastLogin || Date.now()).toLocaleString()
  };
  
  Object.keys(detailFields).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = detailFields[id];
      if (id === 'detailType' && isVipUser) {
        el.style.color = BADGE_CONFIG.vip.color;
        el.style.fontWeight = 'bold';
        el.innerHTML = `<i class="${BADGE_CONFIG.vip.icon}" style="margin-right: 5px;"></i>${detailFields[id]}`;
      }
    }
  });
  
  const joinedEl = document.getElementById('detailJoined');
  if (joinedEl) {
    joinedEl.textContent = new Date(userData.joinedDate || Date.now()).toLocaleDateString();
  }
  
  const badgeContainer = document.getElementById('userBadge');
  if (badgeContainer) {
    if (isVipUser) {
      const badge = BADGE_CONFIG.vip;
      badgeContainer.innerHTML = `
        <div class="badge vip-badge" style="background: ${badge.color}; color: white; padding: 5px 15px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px; animation: badgeGlow 2s infinite;">
          <i class="${badge.icon}"></i> ${badge.text}
        </div>
      `;
    } else {
      badgeContainer.innerHTML = '';
    }
  }
}

function setupDashboardListeners() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
  
  const supportBtn = document.getElementById('supportBtn');
  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      window.location.href = 'https://wa.me/+8801304375487';
    });
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('rememberedUser');
  localStorage.removeItem('currentUser');
  
  // Clear interval
  if (checkDeadlineInterval) {
    clearInterval(checkDeadlineInterval);
    checkDeadlineInterval = null;
  }
  
  // Hide dashboard section
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection) {
    dashboardSection.style.display = 'none';
  }
  
  // Show login section
  const loginSection = document.querySelector('.login-section');
  if (loginSection) {
    loginSection.style.display = 'flex';
    showLoginForm();
  }
  
  // Remove chat link from navigation for VIP users
  removeChatLinkFromNavigation();
}

// Remove chat link from navigation when user logs out
function removeChatLinkFromNavigation() {
  const chatLi = document.querySelector('li a[href="chat.html"]')?.parentElement;
  if (chatLi) {
    chatLi.remove();
    console.log("Chat link removed on logout");
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing...");
  
  // Initialize VIP member cache
  initializeVipMemberCache();
  
  // Set birth date limits
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  const birthDateInput = document.getElementById("birthDate");
  if (birthDateInput) {
    birthDateInput.min = minDate.toISOString().split("T")[0];
    birthDateInput.max = maxDate.toISOString().split("T")[0];
    birthDateInput.value = "";
    birthDateInput.placeholder = "Select your birth date";
  }
  
  // Check if user is already logged in
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser && firebaseInitialized) {
    try {
      const userData = JSON.parse(savedUser);
      showDashboard(userData);
      return;
    } catch (e) {
      console.log("Could not restore session");
    }
  }
  
  // Check for remembered user
  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser && document.getElementById('loginUsername')) {
    document.getElementById('loginUsername').value = rememberedUser;
    const rememberMe = document.getElementById('rememberMe');
    if (rememberMe) rememberMe.checked = true;
  }
  
  // Initialize with login form visible
  showLoginForm();
  
  // Setup password toggles and validation
  setupPasswordToggles();
  setupPasswordStrengthChecker();
  setupPasswordValidation();
  
  // Add event listeners for tab switching
  if (loginTab) {
    loginTab.addEventListener("click", showLoginForm);
  }
  if (signupTab) {
    signupTab.addEventListener("click", showSignupForm);
  }
  if (switchToLogin) {
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }
  if (switchToSignup) {
    switchToSignup.addEventListener("click", (e) => {
      e.preventDefault();
      showSignupForm();
    });
  }
  
  // Add form submission handlers
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }
});

// Login handler
async function handleLogin(e) {
  e.preventDefault();
  
  console.log("Login form submitted");

  const loginUsername = document.getElementById("loginUsername").value.trim();
  const loginPassword = document.getElementById("loginPassword").value;
  const rememberMe = document.getElementById("rememberMe") ? document.getElementById("rememberMe").checked : false;
  const loginError = document.getElementById("loginError");
  const loginSuccess = document.getElementById("loginSuccess");

  // Validation
  if (!loginUsername || !loginPassword) {
    if (loginError) {
      loginError.textContent = "Please fill in all required fields";
      loginError.style.display = "block";
    }
    if (loginSuccess) loginSuccess.style.display = "none";
    return;
  }

  if (loginError) loginError.style.display = "none";
  if (loginSuccess) {
    loginSuccess.textContent = "Logging in...";
    loginSuccess.style.display = "block";
  }

  try {
    if (!firebaseInitialized || !database) {
      throw new Error("Database not connected. Please check your internet connection.");
    }

    console.log("Attempting to authenticate user:", loginUsername);
    
    const userData = await authenticateUser(loginUsername, loginPassword);
    console.log("Authentication result:", userData ? "Success" : "Failed");
    
    if (userData) {
      if (loginSuccess) {
        const isVipUser = userData.uniqueId && SPECIAL_IDS[userData.uniqueId];
        loginSuccess.textContent = `Login successful! ${isVipUser ? ' VIP User Detected!' : ''} Loading dashboard...`;
        if (isVipUser) {
          loginSuccess.style.color = '#FFD700';
          loginSuccess.style.fontWeight = 'bold';
        }
      }
      
      if (rememberMe) {
        localStorage.setItem('rememberedUser', loginUsername);
      }
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      if (userData.firebaseId) {
        await updateUserStats(userData.firebaseId);
      }
      
      setTimeout(() => {
        showDashboard(userData);
      }, 1000);
      
    } else {
      if (loginSuccess) loginSuccess.style.display = "none";
      if (loginError) {
        loginError.textContent = "Invalid username/Unique ID or password";
        loginError.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    if (loginSuccess) loginSuccess.style.display = "none";
    if (loginError) {
      loginError.textContent = "Login failed. Please try again.";
      loginError.style.display = "block";
    }
  }
}

// Signup handler
async function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const uniqueId = document.getElementById("uniqueId").value.trim();
  const username = document.getElementById("username").value.trim();
  const birthDate = document.getElementById("birthDate").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const agreeTerms = document.getElementById("agreeTerms").checked;
  const signupError = document.getElementById("signupError");
  const signupSuccess = document.getElementById("signupSuccess");

  if (name.length < 6) {
    if (signupError) {
      signupError.textContent = "Name must be at least 6 characters long";
      signupError.style.display = "block";
    }
    if (signupSuccess) signupSuccess.style.display = "none";
    return;
  }

  if (!name || !email || !username || !birthDate || !password || !confirmPassword) {
    if (signupError) {
      signupError.textContent = "Please fill in all required fields";
      signupError.style.display = "block";
    }
    if (signupSuccess) signupSuccess.style.display = "none";
    return;
  }

  if (!agreeTerms) {
    if (signupError) {
      signupError.textContent = "You must agree to the terms and conditions";
      signupError.style.display = "block";
    }
    if (signupSuccess) signupSuccess.style.display = "none";
    return;
  }

  if (password.length < 6) {
    if (signupError) {
      signupError.textContent = "Password must be at least 6 characters long";
      signupError.style.display = "block";
    }
    if (signupSuccess) signupSuccess.style.display = "none";
    return;
  }

  if (password !== confirmPassword) {
    if (signupError) {
      signupError.textContent = "Passwords don't match";
      signupError.style.display = "block";
    }
    if (signupSuccess) signupSuccess.style.display = "none";
    return;
  }

  if (uniqueId) {
    if (!/^\d{8}$/.test(uniqueId)) {
      if (signupError) {
        signupError.textContent = "Unique ID must be exactly 8 digits";
        signupError.style.display = "block";
      }
      if (signupSuccess) signupSuccess.style.display = "none";
      return;
    }
    
    if (SPECIAL_IDS[uniqueId]) {
      console.log("VIP unique ID detected:", uniqueId);
    }
  }

  if (!birthDate) {
    if (signupError) {
      signupError.textContent = "Please select your birth date";
      signupError.style.display = "block";
    }
    if (signupSuccess) signupSuccess.style.display = "none";
    return;
  }

  if (signupError) signupError.style.display = "none";
  if (signupSuccess) {
    signupSuccess.textContent = "Creating account...";
    signupSuccess.style.display = "block";
  }

  try {
    if (!firebaseInitialized || !database) {
      throw new Error("Database not connected");
    }

    const userExists = await checkUserExists(username, uniqueId);
    if (userExists) {
      if (signupSuccess) signupSuccess.style.display = "none";
      if (signupError) {
        signupError.textContent = "Username or Unique ID already exists";
        signupError.style.display = "block";
      }
      return;
    }

    let accountType = 'regular';
    if (uniqueId && SPECIAL_IDS[uniqueId]) {
      accountType = 'vip';
      console.log("VIP account activated for unique ID:", uniqueId);
    }

    const userData = {
      name,
      email,
      uniqueId: uniqueId || null,
      username,
      birthDate,
      password,
      accountType: accountType
    };

    const result = await saveUserToFirebase(userData);
    
    if (result.success) {
      if (signupSuccess) {
        const isVip = accountType === 'vip';
        signupSuccess.textContent = `Account created successfully! ${isVip ? 'VIP Account Activated!' : ''} Auto-login in progress...`;
        if (isVip) {
          signupSuccess.style.color = '#FFD700';
          signupSuccess.style.fontWeight = 'bold';
        }
      }
      
      setTimeout(async () => {
        const authResult = await authenticateUser(username, password);
        if (authResult) {
          localStorage.setItem('currentUser', JSON.stringify(authResult));
          showDashboard(authResult);
        } else {
          showLoginForm();
          if (signupSuccess) signupSuccess.style.display = "none";
          if (loginError) {
            loginError.textContent = "Auto-login failed. Please login manually.";
            loginError.style.display = "block";
          }
        }
      }, 2000);
      
    } else {
      if (signupSuccess) signupSuccess.style.display = "none";
      if (signupError) {
        signupError.textContent = "Signup failed. Please try again.";
        signupError.style.display = "block";
      }
    }
    
  } catch (error) {
    console.error("Signup error:", error);
    if (signupSuccess) signupSuccess.style.display = "none";
    if (signupError) {
      signupError.textContent = "Signup failed. Please try again.";
      signupError.style.display = "block";
    }
  }
}