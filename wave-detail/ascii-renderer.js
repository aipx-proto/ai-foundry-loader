document.addEventListener("DOMContentLoaded", function () {
  (function () {
    const loadElements = function () {
      const container = document.getElementById("ascii-canvas-1745265792403")
        .parentNode;
      const canvas = document.getElementById("ascii-canvas-1745265792403");
      const ctx = canvas.getContext("2d");
      const sourceMedia = document.getElementById("source-video-1745265792403");
      if (sourceMedia && sourceMedia.src && sourceMedia.src.includes("ai-foundary-liquid-logo.mp4")) {
        sourceMedia.src = "./grey-waves.mp4";
      }
      if (!canvas || !sourceMedia) {
        setTimeout(loadElements, 50);
        return;
      }
      // copy options from https://promptcache.com/tools/ascii-art-generator
      const configDefault = {
        fontSize: 10,
        charSpacing: 0.1,
        lineHeight: 1,
        enableJiggle: false,
        jiggleIntensity: 1,
        detailFactor: 50,
        contrast: 107,
        brightness: 100,
        saturation: 200,
        useTransparentBackground: false,
        backgroundColor: "transparent",
      };
      let config = configDefault;
      const charSet = " .:-=+*#%@";
      const colorScheme = (r, g, b, brightness, saturation) => {
        const sat = saturation / 100;
        const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
        const rSat = Math.max(0, Math.min(255, gray + sat * (r - gray)));
        const gSat = Math.max(0, Math.min(255, gray + sat * (g - gray)));
        const bSat = Math.max(0, Math.min(255, gray + sat * (b - gray)));
        return `rgb(${Math.round(rSat)},${Math.round(gSat)},${Math.round(bSat)})`;
      };
      let isAnimating = false;
      let chars = [];
      let particles = [];
      let velocities = [];
      let originalPositions = [];
      const isVideo = true;
      function updateCanvasSize() {
        const containerWidth = container.clientWidth || 300;
        const containerHeight = container.clientHeight || 150;
        const mediaRatio = isVideo
          ? sourceMedia.videoHeight / sourceMedia.videoWidth
          : sourceMedia.height / sourceMedia.width;
        let width, height;
        if (containerWidth * mediaRatio <= containerHeight) {
          width = containerWidth;
          height = width * mediaRatio;
        } else {
          height = containerHeight;
          width = height / mediaRatio;
        }
        canvas.width = width;
        canvas.height = height;
        return { width, height };
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
          contrastFactor = 1 + ((contrastPercent - 100) / 100) * 0.8;
        }
        let brightnessFactor;
        if (brightnessPercent < 100) {
          brightnessFactor = (brightnessPercent / 100) * 1.2;
        } else {
          brightnessFactor = 1 + ((brightnessPercent - 100) / 100) * 0.8;
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
      function generateAsciiArt() {
        const dimensions = updateCanvasSize();
        const columns = Math.round(
          Math.max(20, (dimensions.width / 1200) * config.detailFactor * 3)
        );
        const aspectRatio = isVideo
          ? sourceMedia.videoHeight / sourceMedia.videoWidth
          : sourceMedia.height / sourceMedia.width;
        const rows = Math.ceil(columns * aspectRatio);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = columns;
        tempCanvas.height = rows;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(sourceMedia, 0, 0, columns, rows);
        let imageData = tempCtx.getImageData(0, 0, columns, rows);
        imageData = applyContrastAndBrightness(imageData);
        tempCtx.putImageData(imageData, 0, 0);
        const fontSizeX = dimensions.width / columns;
        const fontSizeY = fontSizeX * config.lineHeight;
        if (chars.length === 0) {
          chars = [];
          particles = [];
          velocities = [];
          originalPositions = [];
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
              const posX = x * fontSizeX;
              const posY = y * fontSizeY;
              chars.push({ char: " ", x: posX, y: posY, color: "black" });
              particles.push({ x: posX, y: posY });
              velocities.push({ x: 0, y: 0 });
              originalPositions.push({ x: posX, y: posY });
            }
          }
        }
        const pixels = imageData.data;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < columns; x++) {
            const index = (y * columns + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            const charIndex = Math.floor((brightness / 256) * charSet.length);
            const char = charSet[Math.min(charIndex, charSet.length - 1)];
            const color = colorScheme(r, g, b, brightness, config.saturation);
            const charIdx = y * columns + x;
            if (charIdx < chars.length) {
              chars[charIdx].char = char;
              chars[charIdx].color = color;
            }
          }
        }
      }
      function animate() {
        if (!isAnimating) return;
        if (isVideo) {
          generateAsciiArt();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!config.useTransparentBackground) {
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.font = `${config.fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < particles.length && i < chars.length; i++) {
          const particle = particles[i];
          const velocity = velocities[i];
          const targetX = originalPositions[i].x;
          const targetY = originalPositions[i].y;
          if (config.enableJiggle) {
            velocity.x += (Math.random() - 0.5) * config.jiggleIntensity;
            velocity.y += (Math.random() - 0.5) * config.jiggleIntensity;
          }
          velocity.x *= 0.6; // use a fixed persistence
          velocity.y *= 0.6;
          particle.x += velocity.x;
          particle.y += velocity.y;
          const springX = targetX - particle.x;
          const springY = targetY - particle.y;
          particle.x += springX * 0.4; // use a fixed return speed
          particle.y += springY * 0.4;
          const charInfo = chars[i];
          ctx.fillStyle = charInfo.color;
          ctx.fillText(charInfo.char, particle.x, particle.y);
        }
        requestAnimationFrame(animate);
      }
      function initializeAscii() {
        if (
          (sourceMedia.complete || isVideo) &&
          (isVideo ? sourceMedia.readyState >= 2 : true)
        ) {
          updateCanvasSize();
          generateAsciiArt();
          isAnimating = true;
          animate();
          if (isVideo) sourceMedia.play();
        } else {
          sourceMedia.onload = function () {
            updateCanvasSize();
            generateAsciiArt();
            isAnimating = true;
            animate();
          };
          if (isVideo) {
            sourceMedia.onloadeddata = function () {
              updateCanvasSize();
              generateAsciiArt();
              isAnimating = true;
              animate();
              sourceMedia.play();
            };
          }
        }
      }
      window.addEventListener("resize", function () {
        chars = [];
        generateAsciiArt();
      });
      initializeAscii();
    };
    loadElements();
  })();
});
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(function () {
    const event = document.createEvent("Event");
    event.initEvent("DOMContentLoaded", true, true);
    document.dispatchEvent(event);
  }, 100);
}
