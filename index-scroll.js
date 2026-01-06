// Image data - Edit these URLs
const images = [
  {
    url: "pop1.jpg",
    title: "কারেন্ট শকে মৃত্যু: সতর্ক থাকার শিক্ষা 😓",
    link: "https://youtube.com/shorts/US0t41SPQnw?si=kDdo5yYd9GUpToi6"
  },
  {
    url: "pop2.jpg",
    title: "আলো – মহাবিশ্বের সবচেয়ে দ্রুত ভ্রমণকারী",
    link: "https://youtube.com/shorts/d7gF4jPpLMs?si=PCNbyElrHnV_i1y2"
  },
  {
    url: "pop3.jpg",
    title: "১৯৭১-এর গোপন ষড়যন্ত্র ফাঁস!",
    link: "https://youtube.com/shorts/4cFiJBr44A0?si=a6nDgeO3od_GQTQL"
  },
  {
    url: "pop4.jpg",
    title: "বাংলাদেশের এক রক্তাক্ত অধ্যায়",
    link: "https://youtube.com/shorts/ozYFwFxZKPo?si=ucX--0ZERXXPuKcE"
  },
  {
    url: "pop5.jpg",
    title: "পৃথিবীর সবচেয়ে বড় হুমকি! Global Warming😥",
    link: "https://youtube.com/shorts/eLVdxitX7lo?si=ZjcyGCwzyg-0t4Q4"
  },
];

// Audio Player Code
const audioPlayer = new Audio();
let currentAudioIndex = -1;
let isPlaying = false;

// Performance optimized variables
let scrollPosition = 0;
let animationId = null;
let lastTime = 0;
const scrollSpeed = 1.5;
const wrapper = document.getElementById("scrollingWrapper");
let isPageVisible = true;

// Create image elements with performance optimizations
function createGallery() {
  // Create two sets of images for seamless looping
  const allImages = [...images, ...images];

  allImages.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "image-item";

    // Create clickable link for each image
    const link = document.createElement("a");
    if (image.link) {
      link.href = image.link;
      link.target = "_blank";
    } else {
      link.href = "#";
      link.onclick = (e) => e.preventDefault(); // Prevent default if no link
    }
    link.style.display = "block";
    link.style.width = "100%";
    link.style.height = "100%";
    link.style.textDecoration = "none";
    link.style.color = "inherit";

    const img = new Image();
    img.src = image.url;
    img.alt = image.title;
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";

    // Handle image loading errors
    img.onerror = () => {
      img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmMzZTUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2VjZjBmMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==";
    };

    const caption = document.createElement("div");
    caption.className = "image-caption";
    caption.textContent = image.title;
    caption.style.pointerEvents = "none";

    // Add audio play button if audio exists
    if (image.audio) {
      const audioBtn = document.createElement("button");
      audioBtn.className = "play-audio-btn";
      audioBtn.innerHTML = '<i class="fas fa-play-circle"></i>';
      audioBtn.title = "Play Audio";
      
      audioBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent link click
        e.preventDefault();
        const actualIndex = index % images.length;
        playAudio(actualIndex);
      });
      
      item.appendChild(audioBtn);
    }

    // Add image and caption inside the link
    link.appendChild(img);
    link.appendChild(caption);
    
    // Add link inside the item div
    item.appendChild(link);
    
    wrapper.appendChild(item);
  });

  // Start smooth scrolling
  startScrolling();
}

function playAudio(index) {
  const image = images[index];
  
  if (!image.audio) {
    document.getElementById("nowPlaying").textContent = "No audio available for this image";
    return;
  }
  
  if (currentAudioIndex === index && isPlaying) {
    // If same audio is playing, pause it
    audioPlayer.pause();
    isPlaying = false;
    updateAudioButton(index, false);
    document.getElementById("nowPlaying").textContent = "Audio paused: " + image.title;
  } else {
    // If different audio or paused, play it
    if (currentAudioIndex !== -1 && currentAudioIndex !== index) {
      updateAudioButton(currentAudioIndex, false);
    }
    
    currentAudioIndex = index;
    audioPlayer.src = image.audio;
    audioPlayer.play();
    isPlaying = true;
    updateAudioButton(index, true);
    document.getElementById("nowPlaying").textContent = "Now Playing: " + image.title;
    
    // Update when audio ends
    audioPlayer.onended = () => {
      isPlaying = false;
      updateAudioButton(index, false);
      document.getElementById("nowPlaying").textContent = "Audio finished: " + image.title;
    };
  }
}

function updateAudioButton(index, playing) {
  const buttons = document.querySelectorAll('.play-audio-btn');
  const buttonIndex = index; // For first set of images
  const secondSetIndex = index + images.length; // For second set (looping)
  
  if (buttons[buttonIndex]) {
    buttons[buttonIndex].innerHTML = playing 
      ? '<i class="fas fa-pause-circle"></i>' 
      : '<i class="fas fa-play-circle"></i>';
  }
  
  if (buttons[secondSetIndex]) {
    buttons[secondSetIndex].innerHTML = playing 
      ? '<i class="fas fa-pause-circle"></i>' 
      : '<i class="fas fa-play-circle"></i>';
  }
}

// Optimized scrolling function using requestAnimationFrame
function startScrolling() {
  function scroll(timestamp) {
    if (!isPageVisible) return;
    
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;

    // Update position based on time for consistent speed
    scrollPosition -= (scrollSpeed * deltaTime) / 16;

    // Reset when half scrolled
    if (scrollPosition <= -wrapper.scrollWidth / 2) {
      scrollPosition = 0;
    }

    // Use transform for GPU acceleration
    wrapper.style.transform = `translateX(${scrollPosition}px)`;

    lastTime = timestamp;
    animationId = requestAnimationFrame(scroll);
  }

  // Start the animation
  animationId = requestAnimationFrame(scroll);
}

// Resume scrolling function
function resumeScrolling() {
  if (!animationId && isPageVisible) {
    lastTime = 0;
    startScrolling();
  }
}

// Initialize when page loads
window.addEventListener("load", () => {
  // Quick fade in
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.3s";

  setTimeout(() => {
    createGallery();
    document.body.style.opacity = "1";
  }, 50);
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isPageVisible = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    // Pause audio when page is hidden
    if (isPlaying) {
      audioPlayer.pause();
    }
  } else {
    isPageVisible = true;
    resumeScrolling();
  }
});

// Handle when user returns to the page (using focus event)
window.addEventListener("focus", () => {
  if (isPageVisible && !animationId) {
    resumeScrolling();
  }
});

// Handle when user leaves the page (but not closes it)
window.addEventListener("blur", () => {
  isPageVisible = false;
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (isPlaying) {
    audioPlayer.pause();
  }
});

// Log instructions
console.log('To change images and links, edit the "images" array in the JavaScript code.');