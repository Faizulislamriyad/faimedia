// Firebase Counter with Device Tracking
class FirebaseCounter {
  constructor() {
    this.config = {
      apiKey: "AIzaSyAEhu5To-5_jd8qGQHvLkQXxcjxWsqRIu8",
      authDomain: "fai-media.firebaseapp.com",
      databaseURL: "https://fai-media-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "fai-media",
      storageBucket: "fai-media.firebasestorage.app",
      messagingSenderId: "946674905506",
      appId: "1:946674905506:web:e229628996a19ac4b6c2fb"
    };
    
    this.views = 0;
    this.likes = 0;
    this.deviceId = null;
    this.db = null;
    
    this.init();
  }
  
  init() {
    console.log('🚀 FAI Media Counter Initializing...');
    
    // Generate unique device ID
    this.generateDeviceId();
    
    // Initialize Firebase
    this.initFirebase();
  }
  
  generateDeviceId() {
    // Try to get existing device ID
    this.deviceId = localStorage.getItem('fai_device_id');
    
    if (!this.deviceId) {
      // Create new device ID (simple fingerprint)
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ].join('|');
      
      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      this.deviceId = 'device_' + Math.abs(hash).toString(36);
      localStorage.setItem('fai_device_id', this.deviceId);
    }
    
    console.log('📱 Device ID:', this.deviceId);
  }
  
  initFirebase() {
    if (typeof firebase === 'undefined') {
      console.error('Firebase not loaded');
      return;
    }
    
    try {
      // Initialize Firebase
      firebase.initializeApp(this.config);
      this.db = firebase.database();
      
      console.log('✅ Firebase connected successfully');
      
      // Setup real-time listeners
      this.setupListeners();
      
      // Check and update view count
      this.handleView();
      
      // Setup like button
      this.setupLikeButton();
      
    } catch (error) {
      console.error('Firebase init error:', error);
    }
  }
  
  setupListeners() {
    // Listen for count updates
    this.db.ref('counts').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.views = data.views || 0;
        this.likes = data.likes || 0;
        this.updateDisplay();
        console.log('📊 Counts updated:', data);
      }
    });
    
    // Listen for device tracking
    this.db.ref('devices').child(this.deviceId).on('value', (snapshot) => {
      const deviceData = snapshot.val();
      if (deviceData) {
        localStorage.setItem('fai_has_liked', deviceData.liked ? 'true' : 'false');
        this.updateLikeButton();
      }
    });
  }
  
  async handleView() {
    try {
      // Check if this device has already viewed
      const deviceRef = this.db.ref('devices').child(this.deviceId);
      const snapshot = await deviceRef.once('value');
      const deviceData = snapshot.val();
      
      if (!deviceData || !deviceData.viewed) {
        // First view from this device
        await deviceRef.set({
          viewed: true,
          viewedAt: firebase.database.ServerValue.TIMESTAMP,
          userAgent: navigator.userAgent.substring(0, 100),
          liked: false
        });
        
        // Increment view count
        await this.incrementView();
        
        console.log('👁️ New view from device:', this.deviceId);
      } else {
        console.log('📱 Device already viewed');
      }
      
    } catch (error) {
      console.error('View handling error:', error);
    }
  }
  
  async incrementView() {
    return this.db.ref('counts/views').transaction((current) => {
      return (current || 0) + 1;
    });
  }
  
  async handleLike() {
    try {
      // Check if already liked
      const deviceRef = this.db.ref('devices').child(this.deviceId);
      const snapshot = await deviceRef.once('value');
      const deviceData = snapshot.val();
      
      if (deviceData && deviceData.liked) {
        this.showToast('You already liked! ❤️');
        return false;
      }
      
      // Update device data
      await deviceRef.update({
        liked: true,
        likedAt: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Increment like count
      await this.incrementLike();
      
      // Update local storage
      localStorage.setItem('fai_has_liked', 'true');
      
      // Update UI
      this.updateLikeButton();
      this.showLikeAnimation();
      this.showToast('Thanks for your like! ✅');
      
      console.log('❤️ New like from device:', this.deviceId);
      return true;
      
    } catch (error) {
      console.error('Like error:', error);
      return false;
    }
  }
  
  async incrementLike() {
    return this.db.ref('counts/likes').transaction((current) => {
      return (current || 0) + 1;
    });
  }
  
  updateDisplay() {
    const viewEl = document.getElementById('miniViewCount');
    const likeEl = document.getElementById('miniLikeCount');
    
    if (viewEl) viewEl.textContent = this.formatNumber(this.views);
    if (likeEl) likeEl.textContent = this.formatNumber(this.likes);
  }
  
  updateLikeButton() {
    const likeBtn = document.getElementById('miniLikeBtn');
    if (!likeBtn) return;
    
    const hasLiked = localStorage.getItem('fai_has_liked') === 'true';
    
    if (hasLiked) {
      likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
      likeBtn.classList.add('liked');
      likeBtn.disabled = true;
      likeBtn.title = 'Already liked ❤️';
    } else {
      likeBtn.innerHTML = '<i class="far fa-heart"></i>';
      likeBtn.classList.remove('liked');
      likeBtn.disabled = false;
      likeBtn.title = 'Click to like 👍';
    }
  }
  
  setupLikeButton() {
    const likeBtn = document.getElementById('miniLikeBtn');
    if (!likeBtn) return;
    
    // Initial update
    this.updateLikeButton();
    
    // Add click handler
    likeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleLike();
    });
  }
  
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
  
  showLikeAnimation() {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
      position: fixed;
      top: 50px;
      right: 100px;
      font-size: 24px;
      z-index: 10000;
      animation: floatHeart 1s ease forwards;
      pointer-events: none;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatHeart {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(heart);
    
    setTimeout(() => {
      heart.remove();
      style.remove();
    }, 1000);
  }
  
  showToast(message) {
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
}

// Initialize
let faiCounter = null;

document.addEventListener('DOMContentLoaded', () => {
  faiCounter = new FirebaseCounter();
  window.faiCounter = faiCounter;
});