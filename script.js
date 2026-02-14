// Night Mode Toggle
function toggleNightMode() {
    document.body.classList.toggle("night-mode");
    const isNightMode = document.body.classList.contains("night-mode");
    localStorage.setItem("nightMode", isNightMode);
    
    // Update button icon
    const toggleBtn = document.getElementById("nightModeToggle");
    if (toggleBtn) {
        const icon = toggleBtn.querySelector("i");
        if (isNightMode) {
            icon.className = "fas fa-sun";
            toggleBtn.title = "Switch to Light Mode";
        } else {
            icon.className = "fas fa-moon";
            toggleBtn.title = "Switch to Night Mode";
        }
    }
}

// Initialize night mode from localStorage
function initNightMode() {
    const savedMode = localStorage.getItem("nightMode");
    if (savedMode === "true") {
        document.body.classList.add("night-mode");
        const toggleBtn = document.getElementById("nightModeToggle");
        if (toggleBtn) {
            const icon = toggleBtn.querySelector("i");
            icon.className = "fas fa-sun";
            toggleBtn.title = "Switch to Light Mode";
        }
    }
}

// Call init when page loads
window.addEventListener('DOMContentLoaded', initNightMode);

// Original modal functions remain the same
function showSocial(memberDiv) {
    let modal = document.getElementById("Socal");
    let name = document.getElementById("memberName");
    let img = document.getElementById("memberImg");
    let fb = document.getElementById("fbLink");
    let insta = document.getElementById("instaLink");
    let viewMore = document.getElementById("viewMoreLink");

    // data-attribute থেকে member info নাও
    name.textContent = memberDiv.dataset.name;
    img.src = memberDiv.dataset.img;
    fb.href = memberDiv.dataset.fb;
    insta.href = memberDiv.dataset.insta;
    viewMore.href = memberDiv.dataset.viewmore;

    // View More লিঙ্ক সেট করুন
    if (memberDiv.dataset.viewmore && memberDiv.dataset.viewmore !== "#") {
        viewMore.href = memberDiv.dataset.viewmore;
        viewMore.style.display = "inline-block"; // দেখান
    } else {
        viewMore.style.display = "none"; // লিঙ্ক না থাকলে লুকান
    }

    modal.style.display = "block"; // modal দেখাও
}

function closeSocial() {
    document.getElementById("Socal").style.display = "none";
}

// Click outside modal to close
window.onclick = function(event) {
    let modal = document.getElementById("Socal");
    if(event.target === modal) {
        modal.style.display = "none";
    }
}
