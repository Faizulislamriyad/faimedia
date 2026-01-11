// Mini View and Like Counter System for Header
class MiniViewLikeCounter {
  constructor() {
    this.viewKey = 'faimedia_views';
    this.likeKey = 'faimedia_likes';
    this.userLikeKey = 'faimedia_user_liked';
    this.sessionKey = 'has_visited_faimedia';
    
    this.viewCount = 0;
    this.likeCount = 0;
    this.hasLiked = false;
    
    this.initialize();
  }
  
  initialize() {
    this.loadCounts();
    this.updateMiniDisplay();
    this.setupEventListeners();
    
    // Increment view count if first visit
    this.incrementViewCount();
  }
  
  loadCounts() {
    // Load from localStorage
    try {
      this.viewCount = parseInt(localStorage.getItem(this.viewKey)) || 0;
      this.likeCount = parseInt(localStorage.getItem(this.likeKey)) || 0;
      this.hasLiked = localStorage.getItem(this.userLikeKey) === 'true';
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
  
  incrementViewCount() {
    try {
      const hasVisited = sessionStorage.getItem(this.sessionKey);
      
      if (!hasVisited) {
        this.viewCount++;
        this.saveCounts();
        sessionStorage.setItem(this.sessionKey, 'true');
        this.updateMiniDisplay();
        this.showPulseAnimation('miniViewCount');
      }
    } catch (e) {
      console.error('Error incrementing view count:', e);
    }
  }
  
  handleLike() {
    if (!this.hasLiked) {
      this.likeCount++;
      this.hasLiked = true;
      
      try {
        localStorage.setItem(this.userLikeKey, 'true');
        this.saveCounts();
      } catch (e) {
        console.error('Error saving like:', e);
      }
      
      this.updateMiniDisplay();
      this.showPulseAnimation('miniLikeCount');
      this.showLikeConfirmation();
      return true;
    }
    return false;
  }
  
  updateMiniDisplay() {
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
        miniLikeBtn.title = 'Already liked';
      } else {
        miniLikeBtn.innerHTML = '<i class="far fa-heart"></i>';
        miniLikeBtn.classList.remove('liked');
        miniLikeBtn.disabled = false;
        miniLikeBtn.title = 'Click to like';
      }
    }
  }
  
  formatMiniNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  showPulseAnimation(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.transition = 'transform 0.2s ease';
      element.style.transform = 'scale(1.3)';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }
  }
  
  showLikeConfirmation() {
    // Create a tiny floating heart animation
    const heart = document.createElement('div');
    heart.innerHTML = '<i class="fas fa-heart"></i>';
    heart.style.cssText = `
      position: fixed;
      top: 50px;
      right: 120px;
      color: #ff4757;
      font-size: 16px;
      z-index: 9999;
      animation: floatUp 1s ease forwards;
      pointer-events: none;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatUp {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(-30px) scale(1.5);
          opacity: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(heart);
    
    // Remove after animation completes
    setTimeout(() => {
      heart.remove();
      style.remove();
    }, 1000);
  }
  
  setupEventListeners() {
    const miniLikeBtn = document.getElementById('miniLikeBtn');
    
    if (miniLikeBtn) {
      miniLikeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleLike();
      });
      
      // Add hover effect
      miniLikeBtn.addEventListener('mouseenter', () => {
        if (!miniLikeBtn.disabled) {
          miniLikeBtn.style.transform = 'scale(1.15)';
        }
      });
      
      miniLikeBtn.addEventListener('mouseleave', () => {
        miniLikeBtn.style.transform = 'scale(1)';
      });
    }
    
    // Optional: Double-click to like
    document.addEventListener('dblclick', (e) => {
      // Only trigger if double-clicking on empty space (not on buttons/links)
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && 
          !e.target.closest('button') && !e.target.closest('a')) {
        this.handleLike();
      }
    });
  }
  
  // Optional: Get current stats (can be used for analytics)
  getStats() {
    return {
      views: this.viewCount,
      likes: this.likeCount,
      hasLiked: this.hasLiked
    };
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    const counter = new MiniViewLikeCounter();
    
    // Make it globally accessible if needed
    window.faimediaCounter = counter;
    
    // Log initialization
    console.log('Mini View & Like Counter initialized');
    console.log('Stats:', counter.getStats());
  }, 100);
});

// Optional: Track page visibility for better view counting
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Page is visible again
    console.log('Page visible - counter active');
  }
});

// Optional: Update counter when returning from another page (SPA support)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was restored from cache
    if (window.faimediaCounter) {
      window.faimediaCounter.updateMiniDisplay();
    }
  }
});