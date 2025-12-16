// Night Mode for Members Page..
function toggleNightMode() {
  document.body.classList.toggle("night-mode");
  const toggleBtn = document.getElementById("nightModeToggle");
  const icon = toggleBtn.querySelector("i");

  if (document.body.classList.contains("night-mode")) {
    icon.className = "fas fa-sun";
    toggleBtn.title = "Switch to Day Mode";
  } else {
    icon.className = "fas fa-moon";
    toggleBtn.title = "Switch to Night Mode";
  }

  localStorage.setItem(
    "nightMode",
    document.body.classList.contains("night-mode")
  );
}

// Check for saved night mode preference
window.onload = function () {
  if (localStorage.getItem("nightMode") === "true") {
    document.body.classList.add("night-mode");
    const toggleBtn = document.getElementById("nightModeToggle");
    const icon = toggleBtn.querySelector("i");
    icon.className = "fas fa-sun";
    toggleBtn.title = "Switch to Day Mode";
  }

  animateSkillBars();
};

// Animate skill bars
function animateSkillBars() {
  const skillBars = document.querySelectorAll(".skill-level");
  skillBars.forEach((bar) => {
    const width = bar.getAttribute("data-width");
    bar.style.width = "0";
    setTimeout(() => {
      bar.style.width = width + "%";
    }, 300);
  });
}

// Modal Functions
function openRiyadModal() {
  document.getElementById("Socal").style.display = "block";
}

function closeModal() {
  document.getElementById("Socal").style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("Socal");
  if (event.target === modal) {
    closeModal();
  }
};

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: "smooth",
      });
    }
  });
});

// Scroll animation for skill bars
let skillsAnimated = false;
window.addEventListener("scroll", function () {
  const skillsSection = document.querySelector(".skills-section");
  if (skillsSection && !skillsAnimated) {
    const sectionPosition = skillsSection.getBoundingClientRect().top;
    const screenPosition = window.innerHeight / 1.2;

    if (sectionPosition < screenPosition) {
      animateSkillBars();
      skillsAnimated = true;
    }
  }
});
