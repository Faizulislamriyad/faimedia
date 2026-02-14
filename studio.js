// Canvas and context
const canvas = document.getElementById("posterCanvas");
const ctx = canvas.getContext("2d");
const dimensionDisplay = document.getElementById("dimensionDisplay");

// Preview canvas for templates
const previewCanvas = document.getElementById("templatePreviewCanvas");
const previewCtx = previewCanvas.getContext("2d");

// Current settings
let settings = {
  text: "Welcome to FAI Media! The best platform for creative content.",
  secondaryText: "www.youtube.com/@faimedia.24",
  font: "Hind Siliguri, sans-serif",
  fontSize: 48,
  textColor: "#ffffff",
  bgColor: "#667eea",
  bgColor2: "#764ba2",
  bgType: "color",
  textAlign: "center",
  effects: {
    bold: false,
    italic: false,
    underline: false,
    shadow: false,
    outline: false,
    glow: false,
  },
  glow: {
    intensity: 10,
    color: "#ffffff"
  },
  blur: {
    intensity: 5,
    image: null
  },
  originalImage: null,
  isImageBackground: false
};

// Initialize with 1:1 aspect ratio
resizeCanvas(800, 800);

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  updateCanvas();
  setupEventListeners();
  updateColorPreviews();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Set up Enter key for new lines
  setupTextAreaEnterKey();
  
  // Initialize template categories
  setupTemplateCategories();
  
  // Initialize template file upload
  setupTemplateFileUpload();
});

// Handle window resize
function handleResize() {
  const container = document.getElementById('canvasContainer');
  const canvasRatio = canvas.width / canvas.height;
  const containerRatio = container.clientWidth / container.clientHeight;
  
  // Adjust canvas display size while maintaining aspect ratio
  if (containerRatio > canvasRatio) {
    canvas.style.width = 'auto';
    canvas.style.height = '100%';
  } else {
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
  }
}

// Setup Enter key for text areas
function setupTextAreaEnterKey() {
  const textInput = document.getElementById("textInput");
  const secondaryText = document.getElementById("secondaryText");
  
  textInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const cursorPos = this.selectionStart;
      const textBefore = this.value.substring(0, cursorPos);
      const textAfter = this.value.substring(cursorPos);
      this.value = textBefore + '\n' + textAfter;
      this.selectionStart = this.selectionEnd = cursorPos + 1;
      
      settings.text = this.value;
      updateCanvas();
    }
  });
  
  secondaryText.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const cursorPos = this.selectionStart;
      const textBefore = this.value.substring(0, cursorPos);
      const textAfter = this.value.substring(cursorPos);
      this.value = textBefore + '\n' + textAfter;
      this.selectionStart = this.selectionEnd = cursorPos + 1;
      
      settings.secondaryText = this.value;
      updateCanvas();
    }
  });
}

// Setup template categories
function setupTemplateCategories() {
  const categoryButtons = document.querySelectorAll('.category-btn');
  const templateItems = document.querySelectorAll('.template-item');
  
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active category button
      categoryButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const category = this.getAttribute('data-category');
      
      // Show/hide templates based on category
      templateItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (category === 'all' || itemCategory === category) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// Setup template file upload
function setupTemplateFileUpload() {
  const templateFileUpload = document.getElementById('templateFileUpload');
  
  templateFileUpload.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = function(event) {
        try {
          const templateData = JSON.parse(event.target.result);
          loadTemplateFromFile(templateData);
          alert('Template loaded successfully!');
        } catch (error) {
          alert('Error loading template file. Please make sure it\'s a valid JSON template file.');
          console.error('Template load error:', error);
        }
      };
      
      reader.readAsText(file);
    }
  });
}

// Load template from file
function loadTemplateFromFile(templateData) {
  // Apply background settings
  if (templateData.background) {
    settings.bgType = templateData.background.type || 'color';
    settings.bgColor = templateData.background.color1 || '#667eea';
    settings.bgColor2 = templateData.background.color2 || '#764ba2';
    
    // Update UI
    document.getElementById('bgColor').value = settings.bgColor;
    document.getElementById('bgColor2').value = settings.bgColor2;
    document.getElementById('bgColorPreview').style.backgroundColor = settings.bgColor;
    document.getElementById('bgColor2Preview').style.backgroundColor = settings.bgColor2;
    
    // Update background type buttons
    document.querySelectorAll('.effect-btn[data-bg-type]').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-bg-type') === settings.bgType) {
        btn.classList.add('active');
      }
    });
    
    // Handle background type UI
    handleBackgroundTypeUI(settings.bgType);
  }
  
  // Apply text settings
  if (templateData.text) {
    settings.font = templateData.text.font || 'Hind Siliguri, sans-serif';
    settings.textColor = templateData.text.color || '#ffffff';
    settings.fontSize = templateData.text.size || 48;
    
    document.getElementById('fontSelect').value = settings.font;
    document.getElementById('textColor').value = settings.textColor;
    document.getElementById('fontSize').value = settings.fontSize;
    document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
    document.getElementById('textColorPreview').style.backgroundColor = settings.textColor;
    
    // Update quick font selector
    document.querySelectorAll('.font-option').forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-font') === settings.font) {
        option.classList.add('active');
      }
    });
  }
  
  // Apply image if present
  if (templateData.image && templateData.image.dataUrl) {
    const img = new Image();
    img.onload = function() {
      settings.bgImage = img;
      settings.originalImage = img;
      settings.bgType = 'image';
      updateCanvas();
    };
    img.src = templateData.image.dataUrl;
  }
  
  // Apply effects if present
  if (templateData.effects) {
    settings.effects = { ...settings.effects, ...templateData.effects };
    
    // Update effect buttons UI
    Object.keys(settings.effects).forEach(effect => {
      const btn = document.querySelector(`.effect-btn[data-effect="${effect}"]`);
      if (btn) {
        if (settings.effects[effect]) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    
    // Show/hide glow controls
    const glowControls = document.getElementById("glowControls");
    glowControls.style.display = settings.effects.glow ? 'block' : 'none';
  }
  
  updateCanvas();
  updateColorPreviews();
}

// Save current template to file
function saveCurrentTemplate() {
  const templateData = {
    name: `FAI-Template-${new Date().toISOString().slice(0, 10)}`,
    version: "1.0",
    created: new Date().toISOString(),
    background: {
      type: settings.bgType,
      color1: settings.bgColor,
      color2: settings.bgColor2
    },
    text: {
      font: settings.font,
      color: settings.textColor,
      size: settings.fontSize,
      align: settings.textAlign
    },
    effects: settings.effects,
    glow: settings.glow,
    blur: settings.blur
  };
  
  // Include image data if present
  if (settings.originalImage) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = settings.originalImage.width;
    tempCanvas.height = settings.originalImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(settings.originalImage, 0, 0);
    
    templateData.image = {
      dataUrl: tempCanvas.toDataURL('image/png'),
      width: settings.originalImage.width,
      height: settings.originalImage.height
    };
  }
  
  // Create and download JSON file
  const dataStr = JSON.stringify(templateData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `fai-template-${Date.now()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  alert('Template saved successfully!');
}

// Handle background type UI changes
function handleBackgroundTypeUI(bgType) {
  const bgColor2Input = document.getElementById("bgColor2");
  const bgColor2Preview = document.getElementById("bgColor2Preview");
  const bgColor2Container = document.getElementById("bgColor2Container");
  const imageUploadSection = document.getElementById("imageUploadSection");
  const blurControls = document.getElementById("blurControls");
  const colorControlsSection = document.getElementById("colorControlsSection");
  
  // Show/hide relevant controls
  if (bgType === "gradient") {
    bgColor2Input.style.display = "block";
    bgColor2Preview.style.display = "inline-block";
    bgColor2Container.style.display = "block";
    imageUploadSection.style.display = "none";
    blurControls.style.display = "none";
    colorControlsSection.classList.remove("color-section-hidden");
    settings.isImageBackground = false;
  } else if (bgType === "image") {
    bgColor2Input.style.display = "none";
    bgColor2Preview.style.display = "none";
    bgColor2Container.style.display = "none";
    imageUploadSection.style.display = "block";
    blurControls.style.display = "none";
    colorControlsSection.classList.add("color-section-hidden");
    settings.isImageBackground = true;
  } else if (bgType === "blur") {
    bgColor2Input.style.display = "none";
    bgColor2Preview.style.display = "none";
    bgColor2Container.style.display = "none";
    imageUploadSection.style.display = "block";
    blurControls.style.display = "block";
    colorControlsSection.classList.add("color-section-hidden");
    settings.isImageBackground = true;
  } else {
    bgColor2Input.style.display = "none";
    bgColor2Preview.style.display = "none";
    bgColor2Container.style.display = "block";
    imageUploadSection.style.display = "none";
    blurControls.style.display = "none";
    colorControlsSection.classList.remove("color-section-hidden");
    settings.isImageBackground = false;
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Text input
  document.getElementById("textInput").addEventListener("input", function (e) {
    settings.text = e.target.value;
    updateCanvas();
  });

  document
    .getElementById("secondaryText")
    .addEventListener("input", function (e) {
      settings.secondaryText = e.target.value;
      updateCanvas();
    });

  // Font controls
  document
    .getElementById("fontSelect")
    .addEventListener("change", function (e) {
      settings.font = e.target.value;
      updateCanvas();
    });

  // Quick font selector
  document.querySelectorAll(".font-option").forEach((option) => {
    option.addEventListener("click", function () {
      document
        .querySelectorAll(".font-option")
        .forEach((o) => o.classList.remove("active"));
      this.classList.add("active");
      settings.font = this.getAttribute("data-font");
      document.getElementById("fontSelect").value = settings.font;
      updateCanvas();
    });
  });

  document.getElementById("fontSize").addEventListener("input", function (e) {
    settings.fontSize = parseInt(e.target.value);
    document.getElementById("fontSizeValue").textContent =
      settings.fontSize + "px";
    updateCanvas();
  });

  // Color controls
  document.getElementById("textColor").addEventListener("input", function (e) {
    settings.textColor = e.target.value;
    document.getElementById("textColorPreview").style.backgroundColor =
      settings.textColor;
    updateCanvas();
  });

  document.getElementById("bgColor").addEventListener("input", function (e) {
    settings.bgColor = e.target.value;
    document.getElementById("bgColorPreview").style.backgroundColor =
      settings.bgColor;
    updateCanvas();
  });

  document.getElementById("bgColor2").addEventListener("input", function (e) {
    settings.bgColor2 = e.target.value;
    document.getElementById("bgColor2Preview").style.backgroundColor =
      settings.bgColor2;
    updateCanvas();
  });

  // Text alignment
  document.getElementById("textAlign").addEventListener("change", function (e) {
    settings.textAlign = e.target.value;
    updateCanvas();
  });

  // Text effects
  document.querySelectorAll(".effect-btn[data-effect]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const effect = this.getAttribute("data-effect");
      this.classList.toggle("active");
      settings.effects[effect] = !settings.effects[effect];
      
      // Show/hide glow controls
      if (effect === 'glow') {
        const glowControls = document.getElementById("glowControls");
        glowControls.style.display = settings.effects.glow ? 'block' : 'none';
      }
      
      updateCanvas();
    });
  });

  // Background type
  document.querySelectorAll(".effect-btn[data-bg-type]").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".effect-btn[data-bg-type]")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      settings.bgType = this.getAttribute("data-bg-type");

      // Handle UI for background type
      handleBackgroundTypeUI(settings.bgType);

      // If no image uploaded yet for blur mode, switch to image upload
      if (settings.bgType === "blur" && !settings.originalImage) {
        settings.bgType = "image";
        handleBackgroundTypeUI("image");
        this.classList.remove("active");
        document.querySelector('.effect-btn[data-bg-type="image"]').classList.add("active");
      }

      updateCanvas();
    });
  });

  // Quick color options
  document.querySelectorAll(".color-option").forEach((option) => {
    option.addEventListener("click", function () {
      if (settings.isImageBackground) {
        alert("Color options are disabled when using an image background. Switch to Color or Gradient mode to use colors.");
        return;
      }
      
      settings.bgColor = this.getAttribute("data-color");
      document.getElementById("bgColor").value = settings.bgColor;
      document.getElementById("bgColorPreview").style.backgroundColor =
        settings.bgColor;
      
      // If in gradient mode, set both colors
      if (settings.bgType === "gradient") {
        // Create a complementary color
        const hex = settings.bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Darken color for gradient end
        const darken = 0.7;
        settings.bgColor2 = `#${Math.round(r * darken).toString(16).padStart(2, '0')}${Math.round(g * darken).toString(16).padStart(2, '0')}${Math.round(b * darken).toString(16).padStart(2, '0')}`;
        
        document.getElementById("bgColor2").value = settings.bgColor2;
        document.getElementById("bgColor2Preview").style.backgroundColor = settings.bgColor2;
      }
      
      updateCanvas();
    });
  });

  // Templates - Updated for JSON data
  document.querySelectorAll(".template-item").forEach((template) => {
    template.addEventListener("click", function () {
      // Show preview modal
      showTemplatePreview(this);
    });
  });

  // Image upload
  document
    .getElementById("bgImageUpload")
    .addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = new Image();
          img.onload = function () {
            settings.bgImage = img;
            settings.originalImage = img; // Store original for blur
            settings.bgType = "image";
            
            // Update UI for image mode
            handleBackgroundTypeUI("image");
            document.querySelectorAll('.effect-btn[data-bg-type]').forEach(b => b.classList.remove("active"));
            document.querySelector('.effect-btn[data-bg-type="image"]').classList.add("active");
            
            updateCanvas();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });

  // Size preset dropdown
  document
    .getElementById("sizePreset")
    .addEventListener("change", function (e) {
      const customSizeInput = document.getElementById("customSizeInput");
      if (e.target.value === "custom") {
        customSizeInput.style.display = "flex";
        // Set custom inputs with current canvas dimensions
        document.getElementById("customWidth").value = canvas.width;
        document.getElementById("customHeight").value = canvas.height;
      } else {
        customSizeInput.style.display = "none";
        const [width, height] = e.target.value.split("x").map(Number);
        resizeCanvas(width, height);

        // Update aspect ratio buttons
        updateAspectRatioButtons(width, height);
      }
    });

  // Aspect ratio buttons
  document.querySelectorAll(".aspect-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".aspect-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const ratio = this.getAttribute("data-ratio");
      applyAspectRatio(ratio);
    });
  });

  // Custom size inputs
  document.getElementById("customWidth").addEventListener("input", function () {
    const width = parseInt(this.value) || 800;
    const height =
      parseInt(document.getElementById("customHeight").value) || 600;
    resizeCanvas(width, height);

    // Update aspect ratio buttons
    updateAspectRatioButtons(width, height);
  });

  document
    .getElementById("customHeight")
    .addEventListener("input", function () {
      const width =
        parseInt(document.getElementById("customWidth").value) || 800;
      const height = parseInt(this.value) || 600;
      resizeCanvas(width, height);

      // Update aspect ratio buttons
      updateAspectRatioButtons(width, height);
    });

  // Glow effect controls
  document.getElementById("glowIntensity").addEventListener("input", function(e) {
    settings.glow.intensity = parseInt(e.target.value);
    document.getElementById("glowIntensityValue").textContent = settings.glow.intensity;
    updateCanvas();
  });

  document.getElementById("glowColor").addEventListener("input", function(e) {
    settings.glow.color = e.target.value;
    document.getElementById("glowColorHex").value = settings.glow.color;
    updateCanvas();
  });

  document.getElementById("glowColorHex").addEventListener("input", function(e) {
    const color = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      settings.glow.color = color;
      document.getElementById("glowColor").value = color;
      updateCanvas();
    }
  });

  // Blur effect controls
  document.getElementById("blurIntensity").addEventListener("input", function(e) {
    settings.blur.intensity = parseInt(e.target.value);
    document.getElementById("blurIntensityValue").textContent = settings.blur.intensity;
    updateCanvas();
  });
}

// Show template preview
function showTemplatePreview(templateElement) {
  const modal = document.getElementById("templatePreviewModal");
  const templateName = templateElement.querySelector('.template-label').textContent;
  
  document.getElementById("previewTemplateName").textContent = templateName + " Preview";
  
  // Render preview
  renderTemplatePreview(templateElement);
  
  // Store the template element for later application
  modal.dataset.templateElement = Array.from(document.querySelectorAll('.template-item')).indexOf(templateElement);
  
  modal.style.display = "flex";
}

// Close template preview
function closeTemplatePreview() {
  document.getElementById("templatePreviewModal").style.display = "none";
}

// Render template preview
function renderTemplatePreview(templateElement) {
  const bgData = JSON.parse(templateElement.getAttribute('data-background'));
  const textData = JSON.parse(templateElement.getAttribute('data-text'));
  
  // Clear preview canvas
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  
  // Draw background
  if (bgData.type === "gradient") {
    const gradient = previewCtx.createLinearGradient(0, 0, previewCanvas.width, previewCanvas.height);
    gradient.addColorStop(0, bgData.color1);
    gradient.addColorStop(1, bgData.color2);
    previewCtx.fillStyle = gradient;
  } else {
    previewCtx.fillStyle = bgData.color1;
  }
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  
  // Draw sample text
  previewCtx.font = `${textData.size}px ${textData.font}`;
  previewCtx.fillStyle = textData.color;
  previewCtx.textAlign = "center";
  previewCtx.textBaseline = "middle";
  
  const sampleText = templateElement.querySelector('.template-label').textContent;
  previewCtx.fillText(sampleText, previewCanvas.width / 2, previewCanvas.height / 2);
}

// Apply previewed template
function applyPreviewedTemplate() {
  const modal = document.getElementById("templatePreviewModal");
  const templateIndex = parseInt(modal.dataset.templateElement);
  const templateElement = document.querySelectorAll('.template-item')[templateIndex];
  
  applyTemplateFromElement(templateElement);
  closeTemplatePreview();
}

// Apply template from element
function applyTemplateFromElement(templateElement) {
  // Update active template visual
  document.querySelectorAll('.template-item').forEach(t => t.classList.remove('active'));
  templateElement.classList.add('active');
  
  const bgData = JSON.parse(templateElement.getAttribute('data-background'));
  const textData = JSON.parse(templateElement.getAttribute('data-text'));
  
  // Apply background settings
  settings.bgType = bgData.type;
  settings.bgColor = bgData.color1;
  settings.bgColor2 = bgData.color2 || "#764ba2";
  
  // Apply text settings
  settings.font = textData.font;
  settings.textColor = textData.color;
  settings.fontSize = textData.size;
  
  // Update UI
  document.getElementById('bgColor').value = settings.bgColor;
  document.getElementById('bgColor2').value = settings.bgColor2;
  document.getElementById('fontSelect').value = settings.font;
  document.getElementById('textColor').value = settings.textColor;
  document.getElementById('fontSize').value = settings.fontSize;
  document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
  
  // Update background type buttons
  document.querySelectorAll('.effect-btn[data-bg-type]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-bg-type') === settings.bgType) {
      btn.classList.add('active');
    }
  });
  
  // Handle UI for background type
  handleBackgroundTypeUI(settings.bgType);
  
  // Update quick font selector
  document.querySelectorAll('.font-option').forEach(option => {
    option.classList.remove('active');
    if (option.getAttribute('data-font') === settings.font) {
      option.classList.add('active');
    }
  });
  
  updateCanvas();
  updateColorPreviews();
}

// Resize canvas with proper frame adjustment
function resizeCanvas(width, height) {
  // Limit dimensions
  width = Math.min(Math.max(width, 100), 3000);
  height = Math.min(Math.max(height, 100), 3000);

  // Store previous content if needed
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);

  // Resize main canvas
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  
  canvas.width = width;
  canvas.height = height;

  // Update dimension display
  const aspectRatio = getAspectRatio(width, height);
  dimensionDisplay.textContent = `${width} × ${height} px (${aspectRatio})`;

  // Update canvas container style
  const container = document.getElementById('canvasContainer');
  container.style.maxWidth = width > 800 ? '100%' : `${width}px`;
  
  // Handle canvas scaling for display
  handleResize();

  // Redraw content with new dimensions
  updateCanvas();
}

// Get aspect ratio as string
function getAspectRatio(width, height) {
  // Calculate greatest common divisor
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height);

  return `${width / divisor}:${height / divisor}`;
}

// Update aspect ratio buttons based on current dimensions
function updateAspectRatioButtons(width, height) {
  const currentRatio = getAspectRatio(width, height);

  document.querySelectorAll(".aspect-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-ratio") === currentRatio) {
      btn.classList.add("active");
    }
  });
}

// Apply aspect ratio
function applyAspectRatio(ratio) {
  let width, height;

  switch (ratio) {
    case "16:9":
      width = 1280;
      height = 720;
      break;
    case "9:16":
      width = 720;
      height = 1280;
      break;
    case "1:1":
      width = 800;
      height = 800;
      break;
    case "10:6":
      width = 1000;
      height = 600;
      break;
    case "6:10":
      width = 600;
      height = 1000;
      break;
    case "4:5":
      width = 800;
      height = 1000;
      break;
    case "5:4":
      width = 1000;
      height = 800;
      break;
    default:
      width = 800;
      height = 800;
  }

  // Update size preset dropdown
  const sizeString = `${width}x${height}`;
  const presetSelect = document.getElementById("sizePreset");
  let found = false;

  for (let i = 0; i < presetSelect.options.length; i++) {
    if (presetSelect.options[i].value === sizeString) {
      presetSelect.selectedIndex = i;
      found = true;
      break;
    }
  }

  if (!found) {
    presetSelect.value = "custom";
    document.getElementById("customWidth").value = width;
    document.getElementById("customHeight").value = height;
    document.getElementById("customSizeInput").style.display = "flex";
  } else {
    document.getElementById("customSizeInput").style.display = "none";
  }

  resizeCanvas(width, height);
}

// Update color previews
function updateColorPreviews() {
  document.getElementById("textColorPreview").style.backgroundColor =
    settings.textColor;
  document.getElementById("bgColorPreview").style.backgroundColor =
    settings.bgColor;
  document.getElementById("bgColor2Preview").style.backgroundColor =
    settings.bgColor2;
}

// Apply blur to image
function applyBlurToImage(image, blurAmount) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  // Set temp canvas size
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;
  
  // Apply blur using multiple passes for better quality
  tempCtx.filter = `blur(${blurAmount}px)`;
  tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
  
  return tempCanvas;
}

// Update canvas with current settings
function updateCanvas() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  if (settings.bgType === "gradient") {
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, settings.bgColor);
    gradient.addColorStop(1, settings.bgColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (settings.bgType === "image" && settings.bgImage) {
    // Draw image to fit canvas
    ctx.drawImage(settings.bgImage, 0, 0, canvas.width, canvas.height);
  } else if (settings.bgType === "blur" && settings.originalImage) {
    // Apply blur effect to image
    const blurredImage = applyBlurToImage(settings.originalImage, settings.blur.intensity);
    ctx.drawImage(blurredImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Set text properties
  let fontStyle = "";
  if (settings.effects.bold) fontStyle += "bold ";
  if (settings.effects.italic) fontStyle += "italic ";

  // Check if font is Bangla and adjust font size if needed
  let fontSize = settings.fontSize;
  const isBanglaFont = settings.font.includes('Noto Sans Bengali') || 
                      settings.font.includes('Kalpurush') || 
                      settings.font.includes('SolaimanLipi');
  
  // Adjust font size for Bangla fonts for better readability
  if (isBanglaFont) {
    fontSize = Math.max(settings.fontSize * 0.9, 20);
  }

  ctx.font = `${fontStyle}${fontSize}px ${settings.font}`;
  ctx.fillStyle = settings.textColor;
  ctx.textAlign = settings.textAlign;
  ctx.textBaseline = "middle";

  // Apply glow effect
  if (settings.effects.glow) {
    ctx.shadowColor = settings.glow.color;
    ctx.shadowBlur = settings.glow.intensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  // Apply shadow effect (only if glow is not active)
  else if (settings.effects.shadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
  } else {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Draw main text (with line breaks)
  const textLines = settings.text.split('\n');
  const lineHeight = fontSize * (isBanglaFont ? 1.4 : 1.2);
  const totalHeight = textLines.length * lineHeight;
  const startY = canvas.height / 2 - totalHeight / 2 + lineHeight / 2;

  textLines.forEach((line, lineIndex) => {
    // Wrap each line if needed
    const wrappedLines = wrapText(line, canvas.width - 40);
    
    wrappedLines.forEach((wrappedLine, wrappedIndex) => {
      const actualLineIndex = lineIndex * wrappedLines.length + wrappedIndex;
      const y = startY + actualLineIndex * lineHeight;
      
      const x =
        settings.textAlign === "center"
          ? canvas.width / 2
          : settings.textAlign === "right"
          ? canvas.width - 20
          : 20;

      // Text outline
      if (settings.effects.outline) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText(wrappedLine, x, y);
      }

      ctx.fillText(wrappedLine, x, y);

      // Underline
      if (settings.effects.underline) {
        const textWidth = ctx.measureText(wrappedLine).width;
        const underlineX =
          settings.textAlign === "center"
            ? x - textWidth / 2
            : settings.textAlign === "right"
            ? x - textWidth
            : x;

        ctx.beginPath();
        ctx.moveTo(
          underlineX,
          y + fontSize / 2 + 5
        );
        ctx.lineTo(
          underlineX + textWidth,
          y + fontSize / 2 + 5
        );
        ctx.strokeStyle = settings.textColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  });

  // Draw secondary text (smaller)
  if (settings.secondaryText) {
    const secondaryFontSize = isBanglaFont ? 18 : 20;
    ctx.font = `${secondaryFontSize}px ${settings.font}`;
    ctx.fillStyle = settings.textColor;

    // Reset shadow for secondary text
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const secondaryLines = settings.secondaryText.split('\n');
    secondaryLines.forEach((line, index) => {
      ctx.fillText(
        line,
        settings.textAlign === "center"
          ? canvas.width / 2
          : settings.textAlign === "right"
          ? canvas.width - 20
          : 20,
        canvas.height - 40 - (index * secondaryFontSize * 1.5)
      );
    });
  }
}

// Wrap text function with Bangla support
function wrapText(text, maxWidth) {
  // For Bangla text, split by words
  if (text.match(/[\u0980-\u09FF]/)) {
    return wrapBanglaText(text, maxWidth);
  }
  
  // For English text
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const width = ctx.measureText(currentLine + " " + words[i]).width;
    if (width < maxWidth) {
      currentLine += " " + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Special wrap function for Bangla text
function wrapBanglaText(text, maxWidth) {
  const lines = [];
  let currentLine = "";
  
  // Bangla text wrapping logic
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;
    
    if (ctx.measureText(testLine).width < maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = char;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Generate poster (refresh)
function generatePoster() {
  updateCanvas();
}

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Reset settings
  settings.text = "Welcome to FAI Media! The best platform for creative content.";
  settings.secondaryText = "www.youtube.com/@faimedia.24";
  settings.textColor = "#ffffff";
  settings.bgColor = "#667eea";
  settings.bgColor2 = "#764ba2";
  settings.bgType = "color";
  settings.bgImage = null;
  settings.originalImage = null;
  settings.isImageBackground = false;
  
  // Reset effects
  Object.keys(settings.effects).forEach(key => {
    settings.effects[key] = false;
  });
  
  // Reset glow and blur settings
  settings.glow.intensity = 10;
  settings.glow.color = "#ffffff";
  settings.blur.intensity = 5;
  settings.blur.image = null;
  
  // Reset effect controls
  document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Reset background type to color
  document.querySelectorAll('.effect-btn[data-bg-type]').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector('.effect-btn[data-bg-type="color"]').classList.add('active');
  
  // Hide glow and blur controls
  document.getElementById("glowControls").style.display = "none";
  document.getElementById("blurControls").style.display = "none";
  
  // Reset color section
  document.getElementById("colorControlsSection").classList.remove("color-section-hidden");
  
  // Show/hide relevant controls
  document.getElementById("bgColor2").style.display = "none";
  document.getElementById("imageUploadSection").style.display = "none";
  document.getElementById("bgColor2Container").style.display = "block";
  
  // Update UI
  document.getElementById("textInput").value = settings.text;
  document.getElementById("secondaryText").value = settings.secondaryText;
  document.getElementById("textColor").value = settings.textColor;
  document.getElementById("bgColor").value = settings.bgColor;
  document.getElementById("bgColor2").value = settings.bgColor2;
  document.getElementById("fontSelect").value = "Hind Siliguri, sans-serif";
  document.getElementById("fontSize").value = "48";
  document.getElementById("fontSizeValue").textContent = "48px";
  document.getElementById("textAlign").value = "center";
  
  // Reset quick font selector
  document.querySelectorAll(".font-option").forEach((o) => o.classList.remove("active"));
  document.querySelector('.font-option[data-font="Hind Siliguri, sans-serif"]').classList.add("active");
  
  // Reset glow controls
  document.getElementById("glowIntensity").value = "10";
  document.getElementById("glowIntensityValue").textContent = "10";
  document.getElementById("glowColor").value = "#ffffff";
  document.getElementById("glowColorHex").value = "#ffffff";
  
  // Reset blur controls
  document.getElementById("blurIntensity").value = "5";
  document.getElementById("blurIntensityValue").textContent = "5";
  
  // Reset templates active state
  document.querySelectorAll('.template-item').forEach(t => t.classList.remove('active'));
  document.querySelector('.template-item[data-template="gradient1"]').classList.add('active');
  
  updateColorPreviews();

  // Update dimension display
  const aspectRatio = getAspectRatio(canvas.width, canvas.height);
  dimensionDisplay.textContent = `${canvas.width} × ${canvas.height} px (${aspectRatio})`;
}

// Download image
function downloadImage(format) {
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let filename = `faimedia-poster-${timestamp}`;

  if (format === "png") {
    link.download = filename + ".png";
    link.href = canvas.toDataURL("image/png");
  } else if (format === "jpg") {
    link.download = filename + ".jpg";
    // Create a temporary canvas with white background for JPG
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Fill with white background
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw original canvas on top
    tempCtx.drawImage(canvas, 0, 0);
    
    link.href = tempCanvas.toDataURL("image/jpeg", 0.9);
  } else if (format === "pdf") {
    // Using jsPDF for PDF export
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(canvas.toDataURL('png'), 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename + '.pdf');
    } catch (error) {
      alert("PDF export failed. Please make sure jspdf library is loaded or use PNG/JPG format instead.");
      console.error("PDF export error:", error);
    }
    return;
  }

  link.click();
}