// Image data for different galleries
const galleryData = {
    shorts: [
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
    ],
    educational: [
        {
            url: "4.jpg",
            title: "মস্তিষ্কের অজানা ক্ষমতা উন্মোচন",
            link: "https://youtu.be/QqMQR1kfiyE?si=iKYIRy9Px483DzG8"
        },
        {
            url: "pop7.jpg",
            title: "কোঠা আন্দোলন 2024",
            link: "https://youtu.be/cW3DPZAYPuU?si=XjVg8IkSnaWTdUil"
        },
        {
            url: "pop8.jpg",
            title: "মুসলিমদের স্মরণীয় ২৮ টি আবিষ্কার",
            link: "https://youtu.be/htlZfu7fk4o?si=mTZ1VO0AbBSBevCe"
        },
        {
            url: "pop9.jpg",
            title: "Change Your Perspective",
            link: "https://youtu.be/FVU6gPQwqU4?si=cfnGnJxVh76Oi45j"
        },
        {
            url: "pop10.jpg",
            title: "মৌমাছির পেট থেকে মধু বের হয়!",
            link: "https://youtu.be/uOWiLYrtg_o?si=nsXy36u0A8-7qNd5"
        },
    ],
    islamic: [
        {
            url: "pop11.jpg",
            title: "7 Dec 2025",
            link: ""
        },
        {
            url: "pop12.jpg",
            title: "24 Nov 2025",
            link: ""
        },
        {
            url: "pop13.jpg",
            title: "28 Nov 2025",
            link: ""
        },
        {
            url: "pop14.jpg",
            title: "3 Dec 2025",
            link: ""
        },
        {
            url: "pop15.jpg",
            title: "1 Janu 2026",
            link: ""
        },
    ]
};

// Create gallery for a specific container
function createGallery(galleryId, images) {
    const wrapper = document.getElementById(galleryId);
    if (!wrapper) return;

    // Clear any existing content
    wrapper.innerHTML = '';

    // Create two sets of images for seamless looping
    const allImages = [...images, ...images];

    allImages.forEach((image, index) => {
        const item = document.createElement("div");
        item.className = "image-item";

        // Create clickable link for each image
        const link = document.createElement("a");
        if (image.link && image.link !== "#") {
            link.href = image.link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        } else {
            link.href = "#";
            link.onclick = (e) => e.preventDefault();
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

        // Add image and caption inside the link
        link.appendChild(img);
        link.appendChild(caption);
        
        // Add link inside the item div
        item.appendChild(link);
        
        wrapper.appendChild(item);
    });
}

// Gallery manager class
class GalleryManager {
    constructor() {
        this.galleries = new Map();
        this.isPageVisible = true;
    }

    addGallery(galleryId, images) {
        const gallery = {
            id: galleryId,
            wrapper: document.getElementById(galleryId),
            scrollPosition: 0,
            animationId: null,
            lastTime: 0,
            scrollSpeed: 1.0,
            images: images
        };

        this.galleries.set(galleryId, gallery);
        createGallery(galleryId, images);
        this.startGalleryScrolling(galleryId);
    }

    startGalleryScrolling(galleryId) {
        const gallery = this.galleries.get(galleryId);
        if (!gallery || !gallery.wrapper || !this.isPageVisible) return;

        const scroll = (timestamp) => {
            if (!this.isPageVisible || !gallery.wrapper) {
                if (gallery.animationId) {
                    cancelAnimationFrame(gallery.animationId);
                    gallery.animationId = null;
                }
                return;
            }

            if (!gallery.lastTime) gallery.lastTime = timestamp;
            const deltaTime = timestamp - gallery.lastTime;

            // Update position based on time for consistent speed
            gallery.scrollPosition -= (gallery.scrollSpeed * deltaTime) / 16;

            // Reset when half scrolled
            if (gallery.scrollPosition <= -gallery.wrapper.scrollWidth / 2) {
                gallery.scrollPosition = 0;
            }

            // Use transform for GPU acceleration
            gallery.wrapper.style.transform = `translateX(${gallery.scrollPosition}px)`;

            gallery.lastTime = timestamp;
            gallery.animationId = requestAnimationFrame(scroll);
        };

        gallery.animationId = requestAnimationFrame(scroll);
    }

    resumeScrolling() {
        this.galleries.forEach((gallery, galleryId) => {
            if (!gallery.animationId && this.isPageVisible) {
                gallery.lastTime = 0;
                this.startGalleryScrolling(galleryId);
            }
        });
    }

    stopAll() {
        this.galleries.forEach((gallery) => {
            if (gallery.animationId) {
                cancelAnimationFrame(gallery.animationId);
                gallery.animationId = null;
            }
        });
    }

    setPageVisibility(visible) {
        this.isPageVisible = visible;
        if (!visible) {
            this.stopAll();
        } else {
            this.resumeScrolling();
        }
    }
}

// Initialize gallery manager
const galleryManager = new GalleryManager();

// Initialize when page loads
window.addEventListener("load", () => {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s";

    setTimeout(() => {
        // Create all galleries
        galleryManager.addGallery("scrollingWrapper", galleryData.shorts);
        
        // Add educational gallery if element exists
        if (document.getElementById("educationalGallery")) {
            galleryManager.addGallery("educationalGallery", galleryData.educational);
        }
        
        // Add islamic gallery if element exists
        if (document.getElementById("islamicGallery")) {
            galleryManager.addGallery("islamicGallery", galleryData.islamic);
        }
        
        document.body.style.opacity = "1";
    }, 50);
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
    galleryManager.setPageVisibility(!document.hidden);
});

// Handle when user returns to the page
window.addEventListener("focus", () => {
    galleryManager.setPageVisibility(true);
});

// Handle when user leaves the page
window.addEventListener("blur", () => {
    galleryManager.setPageVisibility(false);
});

// Handle page unload
window.addEventListener("beforeunload", () => {
    galleryManager.stopAll();
});

// Instructions for adding more galleries
console.log('To add more galleries:');
console.log('1. Add new section in HTML with unique ID');
console.log('2. Add new array in galleryData object');
console.log('3. Call galleryManager.addGallery() with the ID and data');
