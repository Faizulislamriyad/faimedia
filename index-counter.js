// Firebase Counter - One View Per Device Permanently
document.addEventListener('DOMContentLoaded', function() {
  console.log('FAI Media Counter - One View Per Device');
  
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAEhu5To-5_jd8qGQHvLkQXxcjxWsqRIu8",
    authDomain: "fai-media.firebaseapp.com",
    databaseURL: "https://fai-media-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fai-media",
    storageBucket: "fai-media.firebasestorage.app",
    messagingSenderId: "946674905506",
    appId: "1:946674905506:web:e229628996a19ac4b6c2fb"
  };
  
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    return;
  }
  
  try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    
    console.log('✅ Firebase initialized');
    
    // Generate device ID (permanent)
    const deviceId = generateDeviceId();
    console.log('📱 Device ID:', deviceId);
    
    // Listen for real-time updates
    database.ref('counts').on('value', function(snapshot) {
      const data = snapshot.val();
      if (data) {
        // Update display
        const viewCount = document.getElementById('miniViewCount');
        const likeCount = document.getElementById('miniLikeCount');
        
        if (viewCount) viewCount.textContent = formatNumber(data.views || 0);
        if (likeCount) likeCount.textContent = formatNumber(data.likes || 0);
        
        console.log('📊 Data updated:', {
          views: data.views || 0,
          likes: data.likes || 0,
          uniqueDevices: data.devices ? Object.keys(data.devices).length : 0
        });
      }
    }, function(error) {
      console.error('Firebase read error:', error);
    });
    
    // Check and handle device view
    checkDeviceView(database, deviceId);
    
    // Setup like button
    setupLikeButton(database, deviceId);
    
  } catch (error) {
    console.error('Firebase error:', error);
  }
});

// Generate permanent device ID
function generateDeviceId() {
  // Try to get existing device ID
  let deviceId = localStorage.getItem('fai_device_id');
  
  if (!deviceId) {
    // Create fingerprint (permanent)
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');
    
    // Generate hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    deviceId = 'device_' + Math.abs(hash).toString(36);
    localStorage.setItem('fai_device_id', deviceId);
    console.log('🆕 New device registered:', deviceId);
  }
  
  return deviceId;
}

// Check if device has viewed and update count
function checkDeviceView(db, deviceId) {
  db.ref('counts/devices/' + deviceId).once('value').then((snapshot) => {
    const deviceData = snapshot.val();
    
    if (!deviceData || !deviceData.viewed) {
      // First view from this device
      const now = Date.now();
      const deviceInfo = {
        viewed: true,
        firstView: now,
        lastSeen: now,
        userAgent: navigator.userAgent.substring(0, 100)
      };
      
      // Save device info
      db.ref('counts/devices/' + deviceId).set(deviceInfo);
      
      // Increment view count
      incrementViewCount(db);
      
      console.log('👁️ First view from device:', deviceId);
    } else {
      // Update last seen
      db.ref('counts/devices/' + deviceId + '/lastSeen').set(Date.now());
      console.log('📱 Device already viewed');
    }
  }).catch((error) => {
    console.error('Device check error:', error);
    // Fallback to simple view count
    simpleIncrementView(db);
  });
}

// Increment view count
function incrementViewCount(db) {
  const now = Date.now();
  
  db.ref('counts').transaction((currentData) => {
    if (currentData) {
      return {
        views: (currentData.views || 0) + 1,
        likes: currentData.likes || 0,
        lastUpdated: now
      };
    } else {
      return {
        views: 1,
        likes: 0,
        lastUpdated: now
      };
    }
  }).then(() => {
    console.log('✅ View count incremented');
  }).catch((error) => {
    console.error('View increment error:', error);
  });
}

// Simple increment (fallback)
function simpleIncrementView(db) {
  db.ref('counts/views').transaction((currentValue) => {
    return (currentValue || 0) + 1;
  });
}

// Setup like button
function setupLikeButton(db, deviceId) {
  const likeButton = document.getElementById('miniLikeBtn');
  if (!likeButton) return;
  
  // Check if device has already liked
  db.ref('counts/devices/' + deviceId + '/liked').once('value').then((snapshot) => {
    const hasLiked = snapshot.val();
    
    if (hasLiked) {
      likeButton.innerHTML = '<i class="fas fa-heart"></i>';
      likeButton.classList.add('liked');
      likeButton.disabled = true;
      likeButton.title = 'Already liked ❤️';
      localStorage.setItem('fai_liked', 'true');
    } else {
      likeButton.innerHTML = '<i class="far fa-heart"></i>';
      likeButton.classList.remove('liked');
      likeButton.disabled = false;
      likeButton.title = 'Click to like 👍';
    }
  }).catch(() => {
    // Fallback to localStorage
    if (localStorage.getItem('fai_liked') === 'true') {
      likeButton.innerHTML = '<i class="fas fa-heart"></i>';
      likeButton.classList.add('liked');
      likeButton.disabled = true;
      likeButton.title = 'Already liked ❤️';
    }
  });
  
  // Add click event
  likeButton.addEventListener('click', function(e) {
    e.preventDefault();
    handleLike(db, deviceId, likeButton);
  });
}

// Handle like
function handleLike(db, deviceId, button) {
  // Check local storage first
  if (localStorage.getItem('fai_liked') === 'true') {
    showToast('You already liked! ❤️');
    return;
  }
  
  const now = Date.now();
  
  // Update device liked status
  db.ref('counts/devices/' + deviceId).update({
    liked: true,
    likedAt: now
  }).then(() => {
    // Increment like count
    return db.ref('counts/likes').transaction((currentValue) => {
      return (currentValue || 0) + 1;
    });
  }).then(() => {
    // Update lastUpdated
    return db.ref('counts/lastUpdated').set(now);
  }).then(() => {
    // Update local storage
    localStorage.setItem('fai_liked', 'true');
    
    // Update button
    button.innerHTML = '<i class="fas fa-heart"></i>';
    button.classList.add('liked');
    button.disabled = true;
    button.title = 'Already liked ❤️';
    
    // Show animations
    showLikeAnimation();
    showToast('Thanks for your like! ✅');
    
    console.log('❤️ Like recorded for device:', deviceId);
  }).catch((error) => {
    console.error('Like error:', error);
    showToast('Error saving like. Please try again.');
  });
}

// Format number
function formatNumber(num) {
  if (!num && num !== 0) return '0';
  
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Show like animation
function showLikeAnimation() {
  const heart = document.createElement('div');
  heart.innerHTML = '❤️';
  heart.style.cssText = `
    position: fixed;
    top: 50px;
    right: 100px;
    font-size: 20px;
    z-index: 10000;
    animation: floatHeart 1s ease forwards;
    pointer-events: none;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatHeart {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(1.5); opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(heart);
  
  setTimeout(() => {
    heart.remove();
    style.remove();
  }, 1000);
}

// Show toast
function showToast(message) {
  const existing = document.querySelector('.fai-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'fai-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 10000;
    animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
    font-size: 14px;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
    style.remove();
  }, 3000);
}
