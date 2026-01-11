// Advanced View and Like Counter System with Device Fingerprinting
class AdvancedViewLikeCounter {
  constructor() {
    this.viewKey = 'faimedia_views';
    this.likeKey = 'faimedia_likes';
    this.userLikeKey = 'faimedia_user_liked';
    this.deviceIdKey = 'faimedia_device_id';
    this.viewsTrackingKey = 'faimedia_viewed_devices';
    
    this.viewCount = 0;
    this.likeCount = 0;
    this.hasLiked = false;
    this.deviceId = null;
    
    this.initialize();
  }
  
  initialize() {
    this.generateDeviceId();
    this.loadCounts();
    this.updateMiniDisplay();
    this.setupEventListeners();
    
    // Check and increment view count for this device
    this.checkAndIncrementView();
  }
  
  generateDeviceId() {
    // Generate a unique device ID using browser fingerprinting
    try {
      // Try to get existing device ID
      this.deviceId = localStorage.getItem(this.deviceIdKey);
      
      if (!this.deviceId) {
        // Generate new device ID
        const fingerprint = this.generateFingerprint();
        this.deviceId = 'device_' + fingerprint;
        localStorage.setItem(this.deviceIdKey, this.deviceId);
        
        console.log('New device detected:', this.deviceId);
      }
    } catch (e) {
      console.error('Error generating device ID:', e);
      // Fallback to session ID if localStorage fails
      this.deviceId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }
  
  generateFingerprint() {
    // Simple fingerprint generation
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
  
  loadCounts() {
    try {
      // Load counts from localStorage
      this.viewCount = parseInt(localStorage.getItem(this.viewKey)) || 0;
      this.likeCount = parseInt(localStorage.getItem(this.likeKey)) || 0;
      this.hasLiked = localStorage.getItem(this.userLikeKey) === 'true';
      
      console.log('Loaded - Views:', this.viewCount, 'Likes:', this.likeCount);
    } catch (e) {
      console.error('Error loading counts:', e);
    }
  }
  
  saveCounts() {
    try {
      localStorage.setItem(this.viewKey, this.viewCount.toString());
      localStorage.setItem(this.likeKey, this.likeCount.toString());
    } catch (e) {
      console.error('Error saving counts:', e);
    }
  }
  
  checkAndIncrementView() {
    try {
      // Get list of devices that have viewed
      const viewedDevices = JSON.parse(localStorage.getItem(this.viewsTrackingKey)) || [];
      
      // Check if current device has already viewed
      const hasViewed = viewedDevices.includes(this.deviceId);
      
      if (!hasViewed) {
        // First view from this device
        this.viewCount++;
        viewedDevices.push(this.deviceId);
        
        // Save updated counts and device list
        this.saveCounts();
        localStorage.setItem(this.viewsTrackingKey, JSON.stringify(viewedDevices));
        
        // Update display with animation
        this.updateMiniDisplay();
        this.showPulseAnimation('miniViewCount');
        
        console.log('New view from device:', this.deviceId, 'Total views:', this.viewCount);
        
        // Optional: Send to server for cross-device tracking
        // this.sendAnalytics('view', this.deviceId);
      } else {
        console.log('Device already viewed:', this.deviceId);
      }
    } catch (e) {
      console.error('Error tracking view:', e);
    }
  }
  
  handleLike() {
    try {
      if (!this.hasLiked) {
        this.likeCount++;
        this.hasLiked = true;
        
        // Save like status and count
        localStorage.setItem(this.userLikeKey, 'true');
        this.saveCounts();
        
        // Update display with animation
        this.updateMiniDisplay();
        this.showPulseAnimation('miniLikeCount');
        this.showLikeConfirmation();
        
        console.log('New like from device:', this.deviceId, 'Total likes:', this.likeCount);
        
        // Optional: Send to server
        // this.sendAnalytics('like', this.deviceId);
        
        return true;
      } else {
        console.log('Device already liked:', this.deviceId);
        this.showAlreadyLikedMessage();
        return false;
      }
    } catch (e) {
      console.error('Error handling like:', e);
      return false;
    }
  }
  
  updateMiniDisplay() {
    try {
      // Update mini counter in header
      const miniViewCount = document.getElementById('miniViewCount');
      const miniLikeCount = document.getElementById('miniLikeCount');
      const miniLikeBtn = document.getElementById('miniLikeBtn');
      
      if (miniViewCount) {
        miniViewCount.textContent = this.formatMiniNumber(this.viewCount);
      }
      
      if (miniLikeCount) {
        miniLikeCount.textContent = this.formatMiniNumber(this.likeCount);
      }
      
      if (miniLikeBtn) {
        if (this.hasLiked) {
          miniLikeBtn.innerHTML = '<i class="fas fa-heart"></i>';
          miniLikeBtn.classList.add('liked');
          miniLikeBtn.disabled = true;
          miniLikeBtn.title = 'আপনি ইতিমধ্যে লাইক দিয়েছেন';
          miniLikeBtn.style.cursor = 'not-allowed';
        } else {
          miniLikeBtn.innerHTML = '<i class="far fa-heart"></i>';
          miniLikeBtn.classList.remove('liked');
          miniLikeBtn.disabled = false;
          miniLikeBtn.title = 'লাইক দিতে ক্লিক করুন';
          miniLikeBtn.style.cursor = 'pointer';
        }
      }
    } catch (e) {
      console.error('Error updating display:', e);
    }
  }
  
  formatMiniNumber(num) {
    try {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    } catch (e) {
      return num.toString();
    }
  }
  
  showPulseAnimation(elementId) {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        element.style.transform = 'scale(1.4)';
        element.style.color = elementId === 'miniViewCount' ? '#007bff' : '#ff4757';
        
        setTimeout(() => {
          element.style.transform = 'scale(1)';
          element.style.color = '';
        }, 300);
      }
    } catch (e) {
      console.error('Error in animation:', e);
    }
  }
  
  showLikeConfirmation() {
    try {
      // Create floating heart animation
      const heart = document.createElement('div');
      heart.innerHTML = '<i class="fas fa-heart"></i>';
      heart.style.cssText = `
        position: fixed;
        top: 60px;
        right: 120px;
        color: #ff4757;
        font-size: 18px;
        z-index: 9999;
        animation: floatUpFade 1.2s ease forwards;
        pointer-events: none;
        filter: drop-shadow(0 2px 4px rgba(255, 71, 87, 0.4));
      `;
      
      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = `
        @keyframes floatUpFade {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) scale(1.3);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-40px) scale(0.8);
            opacity: 0;
          }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(heart);
      
      // Clean up after animation
      setTimeout(() => {
        try {
          heart.remove();
          style.remove();
        } catch (e) {}
      }, 1200);
      
      // Show message in console
      console.log('❤️ ধন্যবাদ! আপনার লাইকটি সংরক্ষণ করা হয়েছে।');
    } catch (e) {
      console.error('Error showing confirmation:', e);
    }
  }
  
  showAlreadyLikedMessage() {
    try {
      // Show a small tooltip-style message
      const message = document.createElement('div');
      message.textContent = 'আপনি ইতিমধ্যে লাইক দিয়েছেন!';
      message.style.cssText = `
        position: fixed;
        top: 60px;
        right: 120px;
        background: #2ed573;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 9999;
        animation: slideDownFade 2s ease forwards;
        pointer-events: none;
        font-weight: bold;
        box-shadow: 0 3px 10px rgba(46, 213, 115, 0.3);
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideDownFade {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          20% {
            transform: translateY(0);
            opacity: 1;
          }
          80% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(10px);
            opacity: 0;
          }
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(message);
      
      setTimeout(() => {
        try {
          message.remove();
          style.remove();
        } catch (e) {}
      }, 2000);
    } catch (e) {
      console.error('Error showing message:', e);
    }
  }
  
  setupEventListeners() {
    try {
      const miniLikeBtn = document.getElementById('miniLikeBtn');
      
      if (miniLikeBtn) {
        // Click event for like button
        miniLikeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleLike();
        });
        
        // Hover effects
        miniLikeBtn.addEventListener('mouseenter', () => {
          if (!miniLikeBtn.disabled) {
            miniLikeBtn.style.transform = 'scale(1.2) rotate(5deg)';
            miniLikeBtn.style.transition = 'all 0.3s ease';
          }
        });
        
        miniLikeBtn.addEventListener('mouseleave', () => {
          miniLikeBtn.style.transform = 'scale(1) rotate(0deg)';
        });
        
        // Touch devices support
        miniLikeBtn.addEventListener('touchstart', () => {
          if (!miniLikeBtn.disabled) {
            miniLikeBtn.style.transform = 'scale(1.1)';
          }
        });
        
        miniLikeBtn.addEventListener('touchend', () => {
          miniLikeBtn.style.transform = 'scale(1)';
        });
      }
      
      // Prevent accidental double-clicks from counting multiple views
      let lastClickTime = 0;
      document.addEventListener('click', (e) => {
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 1000) { // 1 second cooldown
          e.preventDefault();
          e.stopPropagation();
        }
        lastClickTime = currentTime;
      });
      
    } catch (e) {
      console.error('Error setting up event listeners:', e);
    }
  }
  
  // Optional: Reset function for testing
  resetForTesting() {
    try {
      localStorage.removeItem(this.viewKey);
      localStorage.removeItem(this.likeKey);
      localStorage.removeItem(this.userLikeKey);
      localStorage.removeItem(this.viewsTrackingKey);
      localStorage.removeItem(this.deviceIdKey);
      
      this.viewCount = 0;
      this.likeCount = 0;
      this.hasLiked = false;
      this.deviceId = null;
      
      this.generateDeviceId();
      this.updateMiniDisplay();
      
      console.log('✅ Counter reset for testing');
      return true;
    } catch (e) {
      console.error('Error resetting:', e);
      return false;
    }
  }
  
  // Get current statistics
  getStats() {
    return {
      views: this.viewCount,
      likes: this.likeCount,
      hasLiked: this.hasLiked,
      deviceId: this.deviceId,
      uniqueDevices: JSON.parse(localStorage.getItem(this.viewsTrackingKey))?.length || 0
    };
  }
  
  // Optional: Debug function
  debugInfo() {
    const stats = this.getStats();
    console.log('🔍 Counter Debug Info:');
    console.log('Device ID:', stats.deviceId);
    console.log('Total Views:', stats.views);
    console.log('Total Likes:', stats.likes);
    console.log('Has Liked:', stats.hasLiked);
    console.log('Unique Devices:', stats.uniqueDevices);
    console.log('All tracked devices:', JSON.parse(localStorage.getItem(this.viewsTrackingKey)) || []);
  }
}

// Initialize the counter
let faimediaCounter = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Small delay to ensure everything is loaded
    setTimeout(() => {
      faimediaCounter = new AdvancedViewLikeCounter();
      window.faimediaCounter = faimediaCounter;
      
      console.log('🚀 FAI Media Counter initialized successfully');
      console.log('Device:', faimediaCounter.getStats().deviceId);
      
      // Add debug panel for testing (remove in production)
      if (window.location.hash === '#debug') {
        faimediaCounter.debugInfo();
        this.addDebugPanel();
      }
    }, 500);
  } catch (error) {
    console.error('Failed to initialize counter:', error);
  }
});

// Optional: Debug panel function (remove in production)
function addDebugPanel() {
  const debugPanel = document.createElement('div');
  debugPanel.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 10000;
    font-family: monospace;
    max-width: 300px;
  `;
  
  debugPanel.innerHTML = `
    <strong>Counter Debug</strong><br>
    <button onclick="faimediaCounter.debugInfo()">Show Info</button>
    <button onclick="faimediaCounter.resetForTesting()">Reset</button>
    <button onclick="this.parentNode.remove()">Close</button>
  `;
  
  document.body.appendChild(debugPanel);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && faimediaCounter) {
    // Update display when page becomes visible again
    faimediaCounter.updateMiniDisplay();
  }
});

// Clear session storage on page unload to prevent multi-tab issues
window.addEventListener('beforeunload', () => {
  // Keep localStorage data but clear any temporary session data
  sessionStorage.clear();
});