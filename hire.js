// ---------- PROGRESSIVE TIER PRICING ----------
function calculateProgressiveVideoCost(seconds) {
  if (seconds <= 0) return 0;

  // Define segments: [start, end, rate per second]
  const segments = [
    { start: 0, end: 49, rate: 80 },
    { start: 49, end: 60, rate: 70 },
    { start: 60, end: 180, rate: 50 },
    { start: 180, end: 300, rate: 30 },
    { start: 300, end: 600, rate: 5 }
  ];

  let totalCost = 0;
  let remaining = seconds;

  for (let seg of segments) {
    if (remaining <= 0) break;
    const segLength = seg.end - seg.start;
    const take = Math.min(remaining, segLength);
    totalCost += take * seg.rate;
    remaining -= take;
  }

  // Handle beyond 600 seconds (10 minutes)
  if (remaining > 0) {
    // extra minutes: 200 TK per minute (ceil)
    const extraMinutes = Math.ceil(remaining / 60);
    totalCost += extraMinutes * 200;
  }

  return totalCost;
}

function calculateBaseBudget() {
  let length = parseFloat(videoLengthInput.value) || 0;
  let revisions = parseInt(revisionInput.value) || 0;

  let videoCost = calculateProgressiveVideoCost(length);

  // Revision cost: first revision free, then 100 TK each additional
  let revisionCost = 0;
  if (revisions > 1) revisionCost = (revisions - 1) * 100;

  let baseBudget = videoCost + revisionCost + 200;
  return { baseBudget, videoCost, revisionCost };
}

// Update the rate description (shows progressive info)
function getRateDescription(seconds) {
  if (seconds < 50) return "80 TK/sec (0-49 sec) – progressive";
  if (seconds <= 60) return "80 TK/sec (0-49) + 70 TK/sec (50-60)";
  if (seconds <= 180) return "Progressive: 80/70/50 TK/sec up to 3 min";
  if (seconds <= 300) return "Progressive up to 5 min (80/70/50/30)";
  if (seconds <= 600) return "Progressive up to 10 min + 5 TK/sec (5-10 min)";
  return "Progressive up to 10 min, then +200 TK per extra minute";
}

function updateRateInfo() {
  let length = parseFloat(videoLengthInput.value) || 0;
  const rateSpan = document.getElementById("dynamicRateInfo");
  if (rateSpan) {
    rateSpan.innerText = getRateDescription(length);
  }
}

// DOM elements
const videoLengthInput = document.getElementById("videoLength");
const revisionInput = document.getElementById("revisionCount");
const baseBudgetSpan = document.getElementById("baseBudgetAmount");
const negotiateCheckbox = document.getElementById("negotiateCheckbox");
const negotiateContainer = document.getElementById("negotiateInputContainer");
const customBudgetInput = document.getElementById("customBudget");
const budgetPreviewDiv = document.getElementById("budgetPreview");

function updateBudgetDisplay() {
  const { baseBudget, videoCost, revisionCost } = calculateBaseBudget();
  baseBudgetSpan.innerText = baseBudget + " TK";

  let tooltip = `Video cost (progressive): ${videoCost} TK | Revision: ${revisionCost} TK | Fixed: 200 TK`;
  if (!negotiateCheckbox.checked) {
    baseBudgetSpan.title = tooltip;
  } else {
    baseBudgetSpan.title = "Negotiation mode – client will propose budget";
  }
  updateRateInfo();
}

function updateNegotiateUI() {
  if (negotiateCheckbox.checked) {
    negotiateContainer.style.display = "block";
    budgetPreviewDiv.style.opacity = "0.7";
    baseBudgetSpan.style.textDecoration = "line-through";
    if (!document.getElementById("negotiationBadge")) {
      const badge = document.createElement("small");
      badge.id = "negotiationBadge";
      badge.style.display = "block";
      badge.style.fontSize = "0.7rem";
      badge.innerHTML = '<i class="fas fa-comment-dollar"></i> Negotiation mode: final price will be discussed';
      budgetPreviewDiv.appendChild(badge);
    }
  } else {
    negotiateContainer.style.display = "none";
    budgetPreviewDiv.style.opacity = "1";
    baseBudgetSpan.style.textDecoration = "none";
    const badge = document.getElementById("negotiationBadge");
    if (badge) badge.remove();
    if (customBudgetInput) customBudgetInput.value = "";
  }
}

videoLengthInput.addEventListener("input", updateBudgetDisplay);
revisionInput.addEventListener("input", updateBudgetDisplay);
negotiateCheckbox.addEventListener("change", () => {
  updateNegotiateUI();
  updateBudgetDisplay();
});
updateBudgetDisplay();
updateNegotiateUI();

// Form submit handler
const hireForm = document.getElementById("hireRequestForm");
hireForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const fullName = document.getElementById("fullName")?.value.trim();
  const whatsapp = document.getElementById("whatsapp")?.value.trim();
  const email = document.getElementById("emailAddr")?.value.trim();
  const service = document.getElementById("serviceType")?.value;
  const contentType = document.getElementById("contentType")?.value;
  const aspectRatio = document.getElementById("aspectRatio")?.value;
  const videoLength = document.getElementById("videoLength")?.value;
  const revisionCount = document.getElementById("revisionCount")?.value;
  const projectMsg = document.getElementById("projectMsg")?.value.trim();
  const isNegotiate = negotiateCheckbox.checked;
  let customBudgetVal = isNegotiate && customBudgetInput ? customBudgetInput.value.trim() : "";

  if (!fullName || !whatsapp || !email || !service || !projectMsg) {
    alert("⚠️ Please fill all required fields (*).");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    alert("📧 Please provide a valid email address.");
    return;
  }
  if (!whatsapp.match(/^[\+\d\s\-\(\)]{8,20}$/)) {
    alert("📱 Please enter a valid WhatsApp number (incl. country code).");
    return;
  }
  const { baseBudget, videoCost, revisionCost } = calculateBaseBudget();
  let finalBudgetMsg = isNegotiate
    ? customBudgetVal
      ? `Client proposed budget: ${customBudgetVal} TK (Negotiation enabled)`
      : `Client wants to negotiate (budget not specified)`
    : `Estimated budget (progressive): ${baseBudget} TK (Video: ${videoCost} TK progressive, Revisions: ${revisionCost} TK, Fixed 200 TK)`;

  const subject = `Hire Request from ${fullName} - ${service}`;
  const bodyLines = [
    `Name: ${fullName}`,
    `WhatsApp: ${whatsapp}`,
    `Email: ${email}`,
    `Service: ${service}`,
    `Content Type: ${contentType === "reels" ? "Reels / Shorts" : "Long Form"}`,
    `Aspect Ratio: ${aspectRatio}`,
    `Video Length: ${videoLength} seconds`,
    `Revisions: ${revisionCount} (first free, then 100tk/extra)`,
    `Budget Info: ${finalBudgetMsg}`,
    `Negotiate mode: ${isNegotiate ? "Yes" : "No"}`,
    `Project Details: ${projectMsg}`,
    `\nSent from FAI Media Hire Page.`,
  ];
  const bodyEncoded = encodeURIComponent(bodyLines.join("\n"));

  if (
    confirm(
      `✅ Request details collected!\n\n${bodyLines.slice(0, 5).join("\n")}\n\nDo you want to open your email app to send directly to Riyad? (Click OK to open email)`,
    )
  ) {
    window.location.href = `mailto:mdriyadboss1234@gmail.com?subject=${encodeURIComponent(subject)}&body=${bodyEncoded}`;
  } else {
    alert(
      `📋 Demo mode: Request logged. Riyad will contact via WhatsApp within 24h.\n\nSummary:\n${bodyLines.join("\n")}`,
    );
    hireForm.reset();
    negotiateCheckbox.checked = false;
    updateNegotiateUI();
    updateBudgetDisplay();
    document.getElementById("videoLength").value = 30;
    document.getElementById("revisionCount").value = 0;
    updateBudgetDisplay();
  }
});