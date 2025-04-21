/**
 * ripped from https://promptcache.com/tools/ascii-art-generator
 */
// app/javascript/ascii-art-generator.js
var imageLoaded = false;
var originalImage = null;
var isVideo = false;
var video = null;
var chars = [];
var originalPositions = [];
var mouseX = -1e3;
var mouseY = -1e3;
var lastMouseMoveTime = 0;
var isAnimating = false;
var charSets = {
  standard: " .:-=+*#%@",
  blocks: " \u2591\u2592\u2593\u2588",
  minimal: " ._",
  detailed: ' .`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  contrast: " .:#",
  custom: " .:-=+*#%@"
};
var colorSchemes = {
  original: (r, g, b, brightness, saturation) => {
    const sat = saturation / 100;
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    const rSat = Math.max(0, Math.min(255, gray + sat * (r - gray)));
    const gSat = Math.max(0, Math.min(255, gray + sat * (g - gray)));
    const bSat = Math.max(0, Math.min(255, gray + sat * (b - gray)));
    return `rgb(${Math.round(rSat)},${Math.round(gSat)},${Math.round(bSat)})`;
  },
  monochrome: (r, g, b, brightness) => `rgb(${brightness},${brightness},${brightness})`,
  sepia: (r, g, b, brightness) => {
    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;
    return `rgb(${Math.min(255, tr)},${Math.min(255, tg)},${Math.min(255, tb)})`;
  },
  neon: (r, g, b, brightness) => {
    const neonR = brightness < 128 ? 0 : (brightness - 128) * 2 * (r / brightness);
    const neonG = brightness < 128 ? 0 : (brightness - 128) * 2 * (g / brightness);
    const neonB = brightness < 128 ? 0 : (brightness - 128) * 2 * (b / brightness);
    return `rgb(${Math.min(255, neonR * 2)},${Math.min(255, neonG * 2)},${Math.min(255, neonB * 2)})`;
  },
  matrix: (r, g, b, brightness) => {
    const intensity = brightness / 255;
    return `rgb(0,${Math.min(255, intensity * 255 * 1.5)},0)`;
  },
  blueorange: (r, g, b, brightness) => {
    if (brightness < 128) {
      const blueIntensity = (128 - brightness) / 128;
      return `rgb(${20 + blueIntensity * 40},${60 + blueIntensity * 100},${100 + blueIntensity * 155})`;
    } else {
      const orangeIntensity = (brightness - 128) / 128;
      return `rgb(${180 + orangeIntensity * 75},${90 + orangeIntensity * 75},${20 + orangeIntensity * 60})`;
    }
  },
  rainbow: (r, g, b, brightness) => {
    const hue = brightness / 255 * 360;
    const s = 80;
    const l = 50;
    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
    const x = c * (1 - Math.abs(hue / 60 % 2 - 1));
    const m = l / 100 - c / 2;
    let rPrime, gPrime, bPrime;
    if (hue < 60) {
      [rPrime, gPrime, bPrime] = [c, x, 0];
    } else if (hue < 120) {
      [rPrime, gPrime, bPrime] = [x, c, 0];
    } else if (hue < 180) {
      [rPrime, gPrime, bPrime] = [0, c, x];
    } else if (hue < 240) {
      [rPrime, gPrime, bPrime] = [0, x, c];
    } else if (hue < 300) {
      [rPrime, gPrime, bPrime] = [x, 0, c];
    } else {
      [rPrime, gPrime, bPrime] = [c, 0, x];
    }
    const finalR = Math.round((rPrime + m) * 255);
    const finalG = Math.round((gPrime + m) * 255);
    const finalB = Math.round((bPrime + m) * 255);
    return `rgb(${finalR},${finalG},${finalB})`;
  }
};
var currentCharSet = charSets.standard;
var currentColorScheme = colorSchemes.original;
var config = {
  detailFactor: 50,
  detail: 120,
  contrast: 100,
  brightness: 100,
  saturation: 100,
  mouseRadius: 50,
  intensity: 5,
  fontSize: 12,
  charSpacing: 0.6,
  lineHeight: 1,
  mousePersistence: 0.97,
  returnSpeed: 0.05,
  velocityMultiplier: 0.15,
  colorScheme: "original",
  charSet: "standard",
  enableJiggle: true,
  jiggleIntensity: 0.2,
  returnWhenStill: true,
  showWatermark: true,
  backgroundColor: "transparent",
  useTransparentBackground: true
};
var particles = [];
var velocities = [];
var imageUpload = document.getElementById("image-upload");
var detailSlider = document.getElementById("detail");
var detailValue = document.getElementById("detail-value");
var contrastSlider = document.getElementById("contrast");
var contrastValue = document.getElementById("contrast-value");
var brightnessSlider = document.getElementById("brightness");
var brightnessValue = document.getElementById("brightness-value");
var saturationSlider = document.getElementById("saturation");
var saturationValue = document.getElementById("saturation-value");
var mouseRadiusSlider = document.getElementById("mouse-radius");
var radiusValue = document.getElementById("radius-value");
var effectIntensitySlider = document.getElementById("effect-intensity");
var intensityValue = document.getElementById("intensity-value");
var returnSpeedSlider = document.getElementById("return-speed");
var speedValue = document.getElementById("speed-value");
var jiggleToggle = document.getElementById("jiggle-toggle");
var jiggleIntensitySlider = document.getElementById("jiggle-intensity");
var jiggleIntensityValue = document.getElementById("jiggle-intensity-value");
var stillReturnToggle = document.getElementById("still-return");
var charSetSelect = document.getElementById("char-set");
var customCharsContainer = document.getElementById("custom-chars-container");
var customCharsInput = document.getElementById("custom-chars");
var colorSchemeRadios = document.querySelectorAll('input[name="color-scheme"]');
var backgroundColorPicker = document.getElementById("background-color");
var backgroundColorHex = document.getElementById("background-color-hex");
var backgroundTransparent = document.getElementById("background-transparent");
var asciiPreview = document.getElementById("ascii-preview");
var placeholderText = document.getElementById("placeholder-text");
var canvasContainer = document.getElementById("canvas-container");
var asciiCanvas = document.getElementById("ascii-canvas");
var ctx = asciiCanvas.getContext("2d");
var hiddenCanvas = document.getElementById("hidden-canvas");
var hiddenCtx = hiddenCanvas.getContext("2d");
var exportBtn = document.getElementById("export-btn");
var downloadBtn = document.getElementById("download-btn");
var resetBtn = document.getElementById("reset-btn");
var exportArea = document.getElementById("export-area");
var watermarkToggle = document.getElementById("watermark-toggle");
var mediaTypeRadios = document.querySelectorAll('input[name="media-type"]');
var imageUploadContainer = document.getElementById("image-upload-container");
var videoUrlContainer = document.getElementById("video-url-container");
var loadVideoBtn = document.getElementById("load-video");
var videoUrlInput = document.getElementById("video-url");
var videoUpload = document.getElementById("video-upload");
imageUpload.addEventListener("change", handleImageUpload);
videoUpload.addEventListener("change", handleVideoUpload);
detailSlider.addEventListener("input", updateDetailValue);
detailSlider.addEventListener("change", updateAsciiArt);
contrastSlider.addEventListener("input", updateContrastValue);
contrastSlider.addEventListener("change", updateAsciiArt);
brightnessSlider.addEventListener("input", updateBrightnessValue);
brightnessSlider.addEventListener("change", updateAsciiArt);
saturationSlider.addEventListener("input", updateSaturationValue);
saturationSlider.addEventListener("change", updateAsciiArt);
mouseRadiusSlider.addEventListener("input", updateRadiusValue);
effectIntensitySlider.addEventListener("input", updateIntensityValue);
returnSpeedSlider.addEventListener("input", updateReturnSpeedValue);
returnSpeedSlider.addEventListener("change", updateAsciiArt);
jiggleIntensitySlider.addEventListener("input", updateJiggleIntensityValue);
jiggleToggle.addEventListener("change", function() {
  config.enableJiggle = jiggleToggle.checked;
});
stillReturnToggle.addEventListener("change", function() {
  config.returnWhenStill = stillReturnToggle.checked;
});
charSetSelect.addEventListener("change", handleCharSetChange);
customCharsInput.addEventListener("input", function() {
  charSets.custom = customCharsInput.value || " ";
  if (config.charSet === "custom") {
    currentCharSet = charSets.custom;
    updateAsciiArt();
  }
});
downloadBtn.addEventListener("click", downloadCanvasImage);
mediaTypeRadios.forEach((radio) => {
  radio.addEventListener("change", function() {
    imageUploadContainer.style.display = this.value === "image" ? "block" : "none";
    videoUrlContainer.style.display = this.value === "video" ? "block" : "none";
    imageUpload.value = "";
    videoUpload.value = "";
    videoUrlInput.value = "";
    imageLoaded = false;
    placeholderText.style.display = "block";
    canvasContainer.style.display = "none";
    isAnimating = false;
    isVideo = false;
    video = null;
  });
});
loadVideoBtn.addEventListener("click", function() {
  const videoUrl = videoUrlInput.value.trim();
  if (!videoUrl) {
    alert("Please enter a valid video URL.");
    return;
  }
  video = document.createElement("video");
  video.src = videoUrl;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.addEventListener("loadeddata", function() {
    try {
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 1;
      testCanvas.height = 1;
      const testCtx = testCanvas.getContext("2d");
      testCtx.drawImage(video, 0, 0, 1, 1);
      testCtx.getImageData(0, 0, 1, 1);
      imageLoaded = true;
      isVideo = true;
      placeholderText.style.display = "none";
      canvasContainer.style.display = "block";
      updateAsciiArt();
      video.play();
    } catch (e) {
      if (e instanceof DOMException && e.name === "SecurityError") {
        alert("CORS error: The video source does not allow access to its pixel data.\n\nFor exported ASCII art to work, the video must be hosted on a server that:\n1. Has CORS headers enabled (Access-Control-Allow-Origin)\n2. Serves the video from the same domain as your embedding page\n\nYou can still preview the ASCII art here, but exported code might not work.");
        imageLoaded = true;
        isVideo = true;
        placeholderText.style.display = "none";
        canvasContainer.style.display = "block";
        updateAsciiArt();
        video.play();
      } else {
        alert("Error processing video: " + e.message);
        imageLoaded = false;
        isVideo = false;
      }
    }
  });
  video.addEventListener("error", function() {
    alert("Failed to load video. Ensure the URL is valid and accessible.");
    imageLoaded = false;
    isVideo = false;
  });
  video.load();
});
colorSchemeRadios.forEach((radio) => {
  radio.addEventListener("change", function() {
    config.colorScheme = this.value;
    currentColorScheme = colorSchemes[config.colorScheme];
    updateAsciiArt();
  });
});
var colorPickerDebounceTimer = null;
backgroundColorPicker.addEventListener("input", function() {
  const color = this.value;
  backgroundColorHex.value = color;
  if (!backgroundTransparent.checked) {
    config.backgroundColor = color;
    config.useTransparentBackground = false;
    if (colorPickerDebounceTimer) clearTimeout(colorPickerDebounceTimer);
    colorPickerDebounceTimer = setTimeout(() => colorPickerDebounceTimer = null, 50);
  }
});
backgroundColorHex.addEventListener("change", function() {
  const hexValue = this.value;
  if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
    backgroundColorPicker.value = hexValue;
    if (!backgroundTransparent.checked) {
      config.backgroundColor = hexValue;
      config.useTransparentBackground = false;
    }
  } else {
    this.value = backgroundColorPicker.value;
  }
});
backgroundTransparent.addEventListener("change", function() {
  const isTransparent = this.checked;
  backgroundColorPicker.disabled = isTransparent;
  backgroundColorHex.disabled = isTransparent;
  config.useTransparentBackground = isTransparent;
  config.backgroundColor = isTransparent ? "transparent" : backgroundColorPicker.value;
});
watermarkToggle.addEventListener("change", function() {
  config.showWatermark = watermarkToggle.checked;
});
asciiPreview.addEventListener("mousemove", handleMouseMove);
asciiPreview.addEventListener("mouseleave", handleMouseLeave);
exportBtn.addEventListener("click", exportCode);
downloadBtn.addEventListener("click", downloadCanvasImage);
resetBtn.addEventListener("click", resetSettings);
window.addEventListener("resize", function() {
  if (imageLoaded) updateCanvasSize();
});
updateDetailValue();
updateContrastValue();
updateBrightnessValue();
updateSaturationValue();
updateRadiusValue();
updateIntensityValue();
updateReturnSpeedValue();
updateJiggleIntensityValue();
backgroundColorPicker.disabled = true;
backgroundColorHex.disabled = true;
function updateSaturationValue() {
  config.saturation = parseInt(saturationSlider.value);
  saturationValue.textContent = `${config.saturation}%`;
}
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file && file.type.match("image.*")) {
    const reader = new FileReader();
    reader.onload = function(event) {
      originalImage = new Image();
      originalImage.onload = function() {
        imageLoaded = true;
        isVideo = false;
        placeholderText.style.display = "none";
        canvasContainer.style.display = "block";
        updateAsciiArt();
      };
      originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}
function handleVideoUpload(e) {
  const file = e.target.files[0];
  if (file && file.type.match("video.*")) {
    const reader = new FileReader();
    reader.onload = function(event) {
      video = document.createElement("video");
      video.src = event.target.result;
      video.loop = true;
      video.muted = true;
      video.crossOrigin = "anonymous";
      video.addEventListener("loadeddata", function() {
        imageLoaded = true;
        isVideo = true;
        placeholderText.style.display = "none";
        canvasContainer.style.display = "block";
        updateAsciiArt();
        video.play();
      });
      video.addEventListener("error", function() {
        alert("Failed to load video. Please try a different format.");
        imageLoaded = false;
        isVideo = false;
      });
      video.load();
    };
    reader.readAsDataURL(file);
  }
}
function generateAsciiArt(media) {
  if (!imageLoaded) return;
  const columns = config.detail;
  const aspectRatio = isVideo ? media.videoHeight / media.videoWidth : media.height / media.width;
  const rows = Math.ceil(columns * aspectRatio);
  if (!isVideo) {
    console.log(`Generating ASCII for image: ${columns}x${rows}, ratio ${aspectRatio}`);
  }
  hiddenCanvas.width = columns;
  hiddenCanvas.height = rows;
  hiddenCtx.clearRect(0, 0, columns, rows);
  hiddenCtx.drawImage(media, 0, 0, columns, rows);
  let imageData = hiddenCtx.getImageData(0, 0, columns, rows);
  imageData = applyContrastAndBrightness(imageData);
  hiddenCtx.putImageData(imageData, 0, 0);
  const pixels = imageData.data;
  const fontSizeX = asciiCanvas.width / columns;
  const fontSizeY = fontSizeX * config.lineHeight;
  if (chars.length === 0) {
    chars = [];
    particles.length = 0;
    velocities.length = 0;
    originalPositions.length = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const posX = x * fontSizeX;
        const posY = y * fontSizeY;
        chars.push({
          char: " ",
          x: posX,
          y: posY,
          color: "black"
        });
        particles.push({ x: posX, y: posY });
        velocities.push({ x: 0, y: 0 });
        originalPositions.push({ x: posX, y: posY });
      }
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const index = (y * columns + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const charIndex = Math.floor(brightness / 256 * currentCharSet.length);
      const char = currentCharSet[charIndex >= currentCharSet.length ? currentCharSet.length - 1 : charIndex];
      const color = currentColorScheme(r, g, b, brightness, config.saturation);
      const charIdx = y * columns + x;
      if (charIdx < chars.length) {
        chars[charIdx].char = char;
        chars[charIdx].color = color;
      }
    }
  }
  if (!isAnimating) {
    isAnimating = true;
    animate();
  }
}
function resetSettings() {
  detailSlider.value = 50;
  contrastSlider.value = 100;
  brightnessSlider.value = 100;
  saturationSlider.value = 100;
  mouseRadiusSlider.value = 50;
  effectIntensitySlider.value = 5;
  returnSpeedSlider.value = 10;
  jiggleIntensitySlider.value = 2;
  jiggleToggle.checked = true;
  stillReturnToggle.checked = true;
  charSetSelect.value = "standard";
  watermarkToggle.checked = true;
  backgroundColorPicker.value = "#000000";
  backgroundColorHex.value = "#000000";
  backgroundTransparent.checked = true;
  backgroundColorPicker.disabled = true;
  backgroundColorHex.disabled = true;
  document.getElementById("color-original").checked = true;
  updateDetailValue();
  updateContrastValue();
  updateBrightnessValue();
  updateSaturationValue();
  updateRadiusValue();
  updateIntensityValue();
  updateJiggleIntensityValue();
  handleCharSetChange();
  config.colorScheme = "original";
  currentColorScheme = colorSchemes.original;
  config.returnWhenStill = true;
  config.enableJiggle = true;
  config.detailFactor = 50;
  config.showWatermark = true;
  config.useTransparentBackground = true;
  config.backgroundColor = "transparent";
  if (imageLoaded) {
    const media = isVideo ? video : originalImage;
    updateAsciiArt();
  }
}
function updateDetailValue() {
  config.detailFactor = parseInt(detailSlider.value);
  let densityLabel;
  if (config.detailFactor <= 30) densityLabel = "Low density";
  else if (config.detailFactor <= 60) densityLabel = "Medium density";
  else if (config.detailFactor <= 80) densityLabel = "High density";
  else densityLabel = "Very high density";
  detailValue.textContent = densityLabel;
}
function updateContrastValue() {
  config.contrast = parseInt(contrastSlider.value);
  contrastValue.textContent = `${config.contrast}%`;
}
function updateBrightnessValue() {
  config.brightness = parseInt(brightnessSlider.value);
  brightnessValue.textContent = `${config.brightness}%`;
}
function updateRadiusValue() {
  config.mouseRadius = parseInt(mouseRadiusSlider.value);
  radiusValue.textContent = `${config.mouseRadius}px`;
}
function updateIntensityValue() {
  config.intensity = parseInt(effectIntensitySlider.value);
  intensityValue.textContent = config.intensity;
}
function updateReturnSpeedValue() {
  config.returnSpeed = parseInt(returnSpeedSlider.value) / 100;
  speedValue.textContent = `${parseInt(returnSpeedSlider.value)}%`;
}
function updateJiggleIntensityValue() {
  config.jiggleIntensity = parseFloat(jiggleIntensitySlider.value) / 10;
  jiggleIntensityValue.textContent = config.jiggleIntensity.toFixed(1);
}
function handleCharSetChange() {
  config.charSet = charSetSelect.value;
  currentCharSet = charSets[config.charSet];
  customCharsContainer.style.display = config.charSet === "custom" ? "block" : "none";
  if (imageLoaded) {
    const media = isVideo ? video : originalImage;
    updateAsciiArt();
  }
}
function updateCanvasSize() {
  const containerWidth = asciiPreview.clientWidth - 40;
  const containerHeight = asciiPreview.clientHeight - 40;
  const media = isVideo ? video : originalImage;
  const mediaRatio = isVideo ? media.videoHeight / media.videoWidth : media.height / media.width;
  let width, height;
  if (containerWidth * mediaRatio <= containerHeight) {
    width = containerWidth;
    height = width * mediaRatio;
  } else {
    height = containerHeight;
    width = height / mediaRatio;
  }
  console.log(`Canvas size: ${width.toFixed(1)} x ${height.toFixed(1)}, Media ratio: ${mediaRatio.toFixed(3)}`);
  asciiCanvas.width = width;
  asciiCanvas.height = height;
  chars.length = 0;
  config.detail = Math.round(width / 1200 * config.detailFactor * 3);
  config.detail = Math.max(40, Math.min(300, config.detail));
  console.log(`Detail factor: ${config.detailFactor}, Calculated columns: ${config.detail}`);
  generateAsciiArt(media);
}
function updateAsciiArt() {
  if (imageLoaded) {
    const media = isVideo ? video : originalImage;
    updateCanvasSize();
  }
}
function applyContrastAndBrightness(imageData) {
  const contrastPercent = config.contrast;
  const brightnessPercent = config.brightness;
  const data = imageData.data;
  if (contrastPercent === 100 && brightnessPercent === 100) return imageData;
  let contrastFactor;
  if (contrastPercent < 100) {
    contrastFactor = contrastPercent / 100;
  } else {
    contrastFactor = 1 + (contrastPercent - 100) / 100 * 0.8;
  }
  let brightnessFactor;
  if (brightnessPercent < 100) {
    brightnessFactor = brightnessPercent / 100 * 1.2;
  } else {
    brightnessFactor = 1 + (brightnessPercent - 100) / 100 * 0.8;
  }
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (brightnessPercent !== 100) {
      if (brightnessPercent < 100) {
        r *= brightnessFactor;
        g *= brightnessFactor;
        b *= brightnessFactor;
      } else {
        r = r + (255 - r) * (brightnessFactor - 1);
        g = g + (255 - g) * (brightnessFactor - 1);
        b = b + (255 - b) * (brightnessFactor - 1);
      }
    }
    if (contrastPercent !== 100) {
      r = 128 + contrastFactor * (r - 128);
      g = 128 + contrastFactor * (g - 128);
      b = 128 + contrastFactor * (b - 128);
    }
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  return imageData;
}
function handleMouseMove(e) {
  const rect = asciiCanvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  lastMouseMoveTime = Date.now();
}
function handleMouseLeave() {
  mouseX = -1e3;
  mouseY = -1e3;
}
function animate() {
  if (!imageLoaded) {
    isAnimating = false;
    return;
  }
  if (isVideo) {
    generateAsciiArt(video);
  }
  ctx.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height);
  if (!config.useTransparentBackground) {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, asciiCanvas.width, asciiCanvas.height);
  }
  ctx.font = `${config.fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mouseStillTime = Date.now() - lastMouseMoveTime;
  const mouseIsStill = mouseStillTime > 500;
  const totalChars = Math.min(
    particles.length,
    velocities.length,
    originalPositions.length,
    chars.length
  );
  for (let i = 0; i < totalChars; i++) {
    const particle = particles[i];
    const velocity = velocities[i];
    const targetX = originalPositions[i].x;
    const targetY = originalPositions[i].y;
    const dx = particle.x - mouseX;
    const dy = particle.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < config.mouseRadius && (!mouseIsStill || !config.returnWhenStill)) {
      const force = (1 - distance / config.mouseRadius) * config.intensity;
      const angle = Math.atan2(dy, dx);
      velocity.x += Math.cos(angle) * force * 0.2;
      velocity.y += Math.sin(angle) * force * 0.2;
    }
    if (config.enableJiggle) {
      velocity.x += (Math.random() - 0.5) * config.jiggleIntensity;
      velocity.y += (Math.random() - 0.5) * config.jiggleIntensity;
    }
    velocity.x *= config.mousePersistence;
    velocity.y *= config.mousePersistence;
    particle.x += velocity.x;
    particle.y += velocity.y;
    const springX = targetX - particle.x;
    const springY = targetY - particle.y;
    particle.x += springX * config.returnSpeed;
    particle.y += springY * config.returnSpeed;
    const charInfo = chars[i];
    ctx.fillStyle = charInfo.color;
    ctx.fillText(charInfo.char, particle.x, particle.y);
  }
  requestAnimationFrame(animate);
}
function getImageBase64(img) {
  const maxDimension = 800;
  let newWidth, newHeight;
  if (img.width > img.height) {
    newWidth = Math.min(maxDimension, img.width);
    newHeight = newWidth / img.width * img.height;
  } else {
    newHeight = Math.min(maxDimension, img.height);
    newWidth = newHeight / img.height * img.width;
  }
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx2 = canvas.getContext("2d");
  ctx2.drawImage(img, 0, 0, newWidth, newHeight);
  return canvas.toDataURL("image/jpeg", 0.5);
}
function optimizeVideoForExport(videoSrc) {
  if (!videoSrc.startsWith("blob:") && !videoSrc.startsWith("data:")) {
    return videoSrc;
  }
  return videoSrc;
}
function exportCode() {
  if (!imageLoaded) {
    alert("Please add an image or video first!");
    return;
  }
  const uniqueId = Date.now();
  const canvasId = "ascii-canvas-" + uniqueId;
  const mediaId = isVideo ? "source-video-" + uniqueId : "source-image-" + uniqueId;
  let mediaSrc;
  if (isVideo) {
    if (video.src.startsWith("blob:") || video.src.startsWith("data:")) {
      mediaSrc = optimizeVideoForExport(video.src);
    } else {
      mediaSrc = videoUrlInput.value.trim();
    }
  } else {
    mediaSrc = getImageBase64(originalImage);
  }
  const selectedCharSet = currentCharSet;
  const selectedColorSchemeName = config.colorScheme;
  const scriptContent = `
document.addEventListener("DOMContentLoaded", function() {
(function() {
// Get elements - wait until they're available in DOM
const loadElements = function() {
const container = document.getElementById("${canvasId}").parentNode;
const canvas = document.getElementById("${canvasId}");
const ctx = canvas.getContext('2d');
const sourceMedia = document.getElementById("${mediaId}");

if (!canvas || !sourceMedia) {
// Elements not ready yet, try again in 50ms
setTimeout(loadElements, 50);
return;
}

// Configuration
const config = {
mouseRadius: ${config.mouseRadius},
intensity: ${config.intensity},
fontSize: ${config.fontSize || 12},
charSpacing: ${config.charSpacing || 0.6},
lineHeight: ${config.lineHeight || 1},
mousePersistence: ${config.mousePersistence || 0.97},
returnSpeed: ${config.returnSpeed || 0.05},
returnWhenStill: ${config.returnWhenStill},
enableJiggle: ${config.enableJiggle},
jiggleIntensity: ${config.jiggleIntensity},
detailFactor: ${config.detailFactor},
contrast: ${config.contrast},
brightness: ${config.brightness},
saturation: ${config.saturation},
useTransparentBackground: ${config.useTransparentBackground},
backgroundColor: "${config.backgroundColor}"
};

// Character set (properly escaped)
const charSet = ${JSON.stringify(selectedCharSet)};

// Color scheme function
const colorScheme = ${colorSchemes[selectedColorSchemeName].toString()};

// Variables
let mouseX = -1000;
let mouseY = -1000;
let lastMouseMoveTime = 0;
let isAnimating = false;
let chars = [];
let particles = [];
let velocities = [];
let originalPositions = [];
const isVideo = ${isVideo};

// Initialize canvas size
function updateCanvasSize() {
const containerWidth = container.clientWidth || 300;
const containerHeight = container.clientHeight || 150;
const mediaRatio = isVideo ? sourceMedia.videoHeight / sourceMedia.videoWidth : sourceMedia.height / sourceMedia.width;

let width, height;

if (containerWidth * mediaRatio <= containerHeight) {
// Width is the constraint
width = containerWidth;
height = width * mediaRatio;
} else {
// Height is the constraint
height = containerHeight;
width = height / mediaRatio;
}

canvas.width = width;
canvas.height = height;

return { width, height };
}

// Function to apply contrast and brightness
function applyContrastAndBrightness(imageData) {
const contrastPercent = config.contrast;
const brightnessPercent = config.brightness;
const data = imageData.data;

if (contrastPercent === 100 && brightnessPercent === 100) return imageData;

// Improved scaling for contrast
let contrastFactor;
if (contrastPercent < 100) {
// Scale from 0-100% more intuitively
contrastFactor = contrastPercent / 100; // Linear from 0 to 1
} else {
// Scale from 100-200% with diminishing returns
contrastFactor = 1 + (contrastPercent - 100) / 100 * 0.8; // Scales from 1 to 1.8
}

// Improved scaling for brightness
let brightnessFactor;
if (brightnessPercent < 100) {
// Scale from 0-100% - prevents total blackout until very low values
brightnessFactor = (brightnessPercent / 100) * 1.2; // Maintains some visibility even at low values
} else {
// Scale from 100-200% with diminishing returns to prevent washout
brightnessFactor = 1 + (brightnessPercent - 100) / 100 * 0.8; // Scales from 1 to 1.8
}

for (let i = 0; i < data.length; i += 4) {
// Get RGB values
let r = data[i];
let g = data[i + 1];
let b = data[i + 2];

// Apply brightness with improved scaling
if (brightnessPercent !== 100) {
if (brightnessPercent < 100) {
// Gentler darkening that preserves some detail even at low values
r *= brightnessFactor;
g *= brightnessFactor;
b *= brightnessFactor;
} else {
// Bright side: approach white gradually using a curve
r = r + (255 - r) * (brightnessFactor - 1);
g = g + (255 - g) * (brightnessFactor - 1);
b = b + (255 - b) * (brightnessFactor - 1);
}
}

// Apply contrast with improved midpoint preservation
if (contrastPercent !== 100) {
// Apply contrast around the midpoint (128)
r = 128 + contrastFactor * (r - 128);
g = 128 + contrastFactor * (g - 128);
b = 128 + contrastFactor * (b - 128);
}

// Clamp values
data[i] = Math.max(0, Math.min(255, r));
data[i + 1] = Math.max(0, Math.min(255, g));
data[i + 2] = Math.max(0, Math.min(255, b));
}

return imageData;
}

// Function to generate ASCII art
function generateAsciiArt() {
const dimensions = updateCanvasSize();

// Calculate dimensions based on container size and detail factor
const columns = Math.round(Math.max(20, (dimensions.width / 1200) * config.detailFactor * 3));
const aspectRatio = isVideo ? sourceMedia.videoHeight / sourceMedia.videoWidth : sourceMedia.height / sourceMedia.width;
const rows = Math.ceil(columns * aspectRatio);

// Create temporary canvas for processing
const tempCanvas = document.createElement('canvas');
tempCanvas.width = columns;
tempCanvas.height = rows;
const tempCtx = tempCanvas.getContext('2d');

// Draw and process image or video frame
tempCtx.drawImage(sourceMedia, 0, 0, columns, rows);
let imageData = tempCtx.getImageData(0, 0, columns, rows);
imageData = applyContrastAndBrightness(imageData);
tempCtx.putImageData(imageData, 0, 0);

// Calculate font size based on canvas width
const fontSizeX = dimensions.width / columns;
const fontSizeY = fontSizeX * config.lineHeight;

// Initialize arrays only if empty (first run)
if (chars.length === 0) {
  chars = [];
  particles = [];
  velocities = [];
  originalPositions = [];
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const posX = x * fontSizeX;
      const posY = y * fontSizeY;
      
      chars.push({
        char: ' ',
        x: posX,
        y: posY,
        color: 'black'
      });
      
      particles.push({x: posX, y: posY});
      velocities.push({x: 0, y: 0});
      originalPositions.push({x: posX, y: posY});
    }
  }
}

// Update characters and colors
const pixels = imageData.data;
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < columns; x++) {
    const index = (y * columns + x) * 4;
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    
    // Calculate brightness
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Map brightness to ASCII character
    const charIndex = Math.floor(brightness / 256 * charSet.length);
    const char = charSet[Math.min(charIndex, charSet.length - 1)];
    
    // Apply color scheme
    const color = colorScheme(r, g, b, brightness, config.saturation);
    
    const charIdx = y * columns + x;
    if (charIdx < chars.length) {
      chars[charIdx].char = char;
      chars[charIdx].color = color;
    }
  }
}
}

// Animation function
function animate() {
if (!isAnimating) return;

// Update ASCII characters for video frames
if (isVideo) {
  generateAsciiArt();
}

// Clear canvas with the configured background color
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Apply background color if not transparent
if (!config.useTransparentBackground) {
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Set text properties
ctx.font = \`\${config.fontSize}px monospace\`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Check if mouse has been still
const mouseStillTime = Date.now() - lastMouseMoveTime;
const mouseIsStill = mouseStillTime > 500;

// Update particle positions
for (let i = 0; i < particles.length && i < chars.length; i++) {
const particle = particles[i];
const velocity = velocities[i];
const targetX = originalPositions[i].x;
const targetY = originalPositions[i].y;

// Calculate distance from mouse
const dx = particle.x - mouseX;
const dy = particle.y - mouseY;
const distance = Math.sqrt(dx * dx + dy * dy);

// Apply force if within radius (unless mouse is still)
if (distance < config.mouseRadius && (!mouseIsStill || !config.returnWhenStill)) {
const force = (1 - distance / config.mouseRadius) * config.intensity;
const angle = Math.atan2(dy, dx);
velocity.x += Math.cos(angle) * force * 0.2;
velocity.y += Math.sin(angle) * force * 0.2;
}

// Add some small random movement
if (config.enableJiggle) {
velocity.x += (Math.random() - 0.5) * config.jiggleIntensity;
velocity.y += (Math.random() - 0.5) * config.jiggleIntensity;
}

// Apply velocity with damping
velocity.x *= config.mousePersistence;
velocity.y *= config.mousePersistence;
particle.x += velocity.x;
particle.y += velocity.y;

// Apply spring force to return to target position
const springX = targetX - particle.x;
const springY = targetY - particle.y;
particle.x += springX * config.returnSpeed;
particle.y += springY * config.returnSpeed;

// Draw the character
const charInfo = chars[i];
ctx.fillStyle = charInfo.color;
ctx.fillText(charInfo.char, particle.x, particle.y);
}

requestAnimationFrame(animate);
}

// Event listeners
canvas.addEventListener('mousemove', function(e) {
const rect = canvas.getBoundingClientRect();
mouseX = e.clientX - rect.left;
mouseY = e.clientY - rect.top;
lastMouseMoveTime = Date.now();
});

canvas.addEventListener('mouseleave', function() {
mouseX = -1000;
mouseY = -1000;
});

// Start the process once media is loaded
function initializeAscii() {
if ((sourceMedia.complete || isVideo) && (isVideo ? sourceMedia.readyState >= 2 : true)) {
  updateCanvasSize();
  generateAsciiArt();
  isAnimating = true;
  animate();
  if (isVideo) sourceMedia.play();
} else {
  sourceMedia.onload = function() {
    updateCanvasSize();
    generateAsciiArt();
    isAnimating = true;
    animate();
  };
  
  if (isVideo) {
    sourceMedia.onloadeddata = function() {
      updateCanvasSize();
      generateAsciiArt();
      isAnimating = true;
      animate();
      sourceMedia.play();
    };
  }
}
}

// Handle window resize
window.addEventListener('resize', function() {
chars = [];
generateAsciiArt();
});

// Initialize
initializeAscii();
};

// Start trying to load elements
loadElements();
})();
});

// Safety backup for DOMContentLoaded already fired
if (document.readyState === "complete" || document.readyState === "interactive") {
setTimeout(function() {
const event = document.createEvent("Event");
event.initEvent("DOMContentLoaded", true, true);
document.dispatchEvent(event);
}, 100);
}
`;
  const minifiedScript = minifyJS(scriptContent);
  const exportHtml = `<!-- ASCII Art Embed (Generated with promptcache.com/tools/ascii-art-generator) -->
<span>
<span style="width: 100%; height: 100%; margin: 0 auto; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center;">
<canvas id="${canvasId}" style="display: block; max-width: 100%; max-height: 100%;"></canvas>
${isVideo ? `<video id="${mediaId}" src="${mediaSrc}" style="display: none;" loop muted crossorigin="anonymous"></video>` : `<img id="${mediaId}" src="${mediaSrc}" style="display: none;">`}
<script>
//<![CDATA[
${minifiedScript}
//]]>
<\/script>
</span>
<a href='https://promptcache.com/tools/ascii-art-generator' target='_blank' style='display: ${config.showWatermark ? "block" : "none"}; font-size: 12px; text-align: right; padding: 2px;'>Promptcache ASCII Art Generator</a>
</span>
`;
  exportArea.style.display = "block";
  exportArea.value = exportHtml;
  exportArea.select();
}
function downloadCanvasImage() {
  if (!imageLoaded) {
    alert("Please add an image or video first!");
    return;
  }
  const wasAnimating = isAnimating;
  isAnimating = false;
  const downloadCanvas = document.createElement("canvas");
  downloadCanvas.width = asciiCanvas.width;
  downloadCanvas.height = asciiCanvas.height;
  const downloadCtx = downloadCanvas.getContext("2d");
  if (!config.useTransparentBackground) {
    downloadCtx.fillStyle = config.backgroundColor;
    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
  }
  downloadCtx.drawImage(asciiCanvas, 0, 0);
  if (config.showWatermark) {
    downloadCtx.font = "12px Arial";
    downloadCtx.fillStyle = "rgba(200, 200, 200, 0.5)";
    downloadCtx.textAlign = "right";
    downloadCtx.fillText("promptcache.com/tools/ascii-art-generator", downloadCanvas.width - 10, downloadCanvas.height - 10);
  }
  try {
    const dataUrl = downloadCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").substring(0, 19);
    link.download = `ascii-art-${timestamp}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Error generating PNG:", e);
    alert("Could not generate PNG. This can happen with video files due to security restrictions.");
  }
  if (wasAnimating) {
    isAnimating = true;
    requestAnimationFrame(animate);
  }
}
function minifyJS(code) {
  return code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\n/gm, "").replace(/\s+/g, " ").replace(/\s*([{},:;=\(\)\[\]])\s*/g, "$1").replace(/;\}/g, "}").trim();
}
//# sourceMappingURL=/assets/ascii-art-generator-18e6a0a5.js.map
