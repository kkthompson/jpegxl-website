
document.addEventListener('DOMContentLoaded', () => {
  const resourcesPath = '/resources';
  const imageDirectory = `${resourcesPath}/DistanceVSEffort_Images`;
  const dataDirectory = `${resourcesPath}/dve`;
  const imageChunks = new Map();

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
    return response.json();
  }

  fetchJson(`${dataDirectory}/index.json`)
    .then(initializeApp)
    .catch(error => {
      console.error('Error fetching visualizer catalog:', error);
      alert('Failed to load image data. Please try again later.');
    });

  function initializeApp(catalog) {
    const imageDropdown = document.getElementById('image-dropdown');
    const imageElement = document.getElementById('image');
    const imageViewport = document.getElementById('image-viewport');
    const slider = document.getElementById('slider');
    const effortSlider = document.getElementById('effort-slider');
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomValue = document.getElementById('zoom-value');
    const sizeSpan = document.getElementById('size');
    const bppSpan = document.getElementById('bpp');
    const ssimSpan = document.getElementById('ssim');
    const compressionTimeSpan = document.getElementById('compression-time');
    const sliderLabels = document.getElementById('slider-labels');
    const effortSliderLabels = document.getElementById('effort-slider-labels');
    const distanceLabel = document.querySelector('.distance-label');
    const effortLabel = document.querySelector('.effort-label');
    let currentImageIndex = 0;
    let currentEffortIndex = 0;
    let previousDistance = 0; // Variable to store the previous distance value
    let currentZoom = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOriginX = 0;
    let panOriginY = 0;
    let isLosslessPreview = false;

    let currentImage;
    let loadVersion = 0;

    catalog.images.forEach(image => {
      const option = document.createElement('option');
      option.value = image.id;
      option.textContent = image.name;
      imageDropdown.appendChild(option);
    });

    imageDropdown.addEventListener('change', () => loadImage(imageDropdown.value));
    effortSlider.addEventListener('input', handleEffortChange);
    slider.addEventListener('input', handleDistanceChange);
    zoomSlider.addEventListener('input', handleZoomChange);
    imageElement.addEventListener('load', () => {
      clampPan();
      applyZoomAndPan();
    });
    imageViewport.addEventListener('pointerdown', startPan);
    imageViewport.addEventListener('pointermove', movePan);
    imageViewport.addEventListener('pointerup', endPan);
    imageViewport.addEventListener('pointercancel', endPan);
    imageViewport.addEventListener('lostpointercapture', endPan);
    window.addEventListener('keydown', event => {
      if (event.key === 'Shift' && !event.repeat) setLosslessPreview(true);
    });
    window.addEventListener('keyup', event => {
      if (event.key === 'Shift') setLosslessPreview(false);
    });
    window.addEventListener('blur', () => setLosslessPreview(false));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setLosslessPreview(false);
    });

    async function loadImage(id) {
      const requestVersion = ++loadVersion;
      imageDropdown.disabled = true;
      effortSlider.disabled = true;
      slider.disabled = true;

      try {
        const image = await getImageChunk(id);
        if (requestVersion !== loadVersion) return;

        currentImage = image;
        currentEffortIndex = 0;
        currentImageIndex = 0;
        previousDistance = 0;
        const efforts = initializeEffortSlider();
        updateSlidersAndImage(efforts[0]);
      } catch (error) {
        console.error(`Error fetching image data for ${id}:`, error);
        alert('Failed to load this image. Please try another one.');
      } finally {
        if (requestVersion === loadVersion) {
          imageDropdown.disabled = false;
          effortSlider.disabled = false;
          slider.disabled = false;
        }
      }
    }

    function getImageChunk(id) {
      if (!imageChunks.has(id)) {
        imageChunks.set(id, fetchJson(`${dataDirectory}/${id}.json`));
      }
      return imageChunks.get(id);
    }

    function setLosslessPreview(enabled) {
      if (isLosslessPreview === enabled) return;
      isLosslessPreview = enabled;
      if (!currentImage) return;

      const efforts = initializeEffortSlider();
      const effort = efforts[currentEffortIndex];
      const { variants } = initializeDistanceSlider(effort);
      updateImageAndInfo(currentImageIndex, variants, effort);
    }

    function handleEffortChange() {
      currentEffortIndex = parseInt(effortSlider.value, 10);
      const efforts = initializeEffortSlider();
      const { distances, variants } = initializeDistanceSlider(efforts[currentEffortIndex]);
      // Find the closest matching distance to the previous distance
      const closestDistanceIndex = findClosestDistanceIndex(distances, previousDistance);
      currentImageIndex = closestDistanceIndex;
      slider.value = currentImageIndex;
      updateImageAndInfo(currentImageIndex, variants, efforts[currentEffortIndex]);
      effortLabel.textContent = `Effort: ${efforts[currentEffortIndex]}`;
      updateDistanceLabel(distances[currentImageIndex]);
    }
    function handleDistanceChange() {
      currentImageIndex = parseInt(slider.value, 10);
      const efforts = initializeEffortSlider();
      const { distances, variants } = initializeDistanceSlider(efforts[currentEffortIndex]);
      previousDistance = distances[currentImageIndex]; // Store the current distance
      updateImageAndInfo(currentImageIndex, variants, efforts[currentEffortIndex]);
      updateDistanceLabel(distances[currentImageIndex]);
    }
    function initializeEffortSlider() {
      const efforts = Object.keys(currentImage.efforts).map(Number).sort((a, b) => b - a);
      effortSlider.min = 0;
      effortSlider.max = efforts.length - 1;
      effortSliderLabels.innerHTML = '';
      efforts.forEach(effort => {
        const label = document.createElement('span');
        label.textContent = effort;
        effortSliderLabels.appendChild(label);
      });
      effortLabel.textContent = `Effort: ${efforts[currentEffortIndex]}`;
      return efforts;
    }
    function initializeDistanceSlider(effort) {
      const variants = currentImage.efforts[String(effort)] ?? [];
      const distances = variants.map(variant => variant[0]);
      slider.min = 0;
      slider.max = distances.length - 1;
      sliderLabels.innerHTML = '';
      distances.forEach((distance, index) => {
        const isSampledTick = index % Math.ceil(distances.length / 10) === 0;
        const isFinalTick = index === distances.length - 1;
        if (isSampledTick || isFinalTick) {
          const label = document.createElement('span');
          label.textContent = distance.toFixed(1);
          sliderLabels.appendChild(label);
        }
      });
      updateDistanceLabel(distances[currentImageIndex]);
      return { distances, variants };
    }
    function updateSlidersAndImage(effort) {
      const { variants } = initializeDistanceSlider(effort);
      updateImageAndInfo(currentImageIndex, variants, effort);
    }
    function updateImageAndInfo(imageIndex, variants, effort) {
      const imageData = isLosslessPreview
        ? variants.find(([quality]) => quality === 0) ?? variants[imageIndex]
        : variants[imageIndex];
      const [quality, fileName, size, encodingSpeed, bpp, ssim] = imageData;
      imageElement.src = `${imageDirectory}/${fileName}`;
      const previewLabel = isLosslessPreview ? 'Lossless preview. ' : '';
      imageElement.alt = `${previewLabel}Name: ${currentImage.name} Distance: ${quality} Effort: ${effort}`;
      sizeSpan.textContent = size.toLocaleString(); // Format size with commas
      bppSpan.textContent = Number(bpp).toFixed(2); // Limit BPP to 2 decimals
      ssimSpan.textContent = Number(ssim).toFixed(2); // Limit SSIMU2 to 2 decimals
      const compressionTime = (currentImage.pixels / 1000000) / encodingSpeed;
      compressionTimeSpan.textContent = compressionTime.toFixed(3); // Limit to 3 decimals
    }
    function handleZoomChange() {
      const nextZoom = parseFloat(zoomSlider.value);
      setZoom(nextZoom);
    }
    function setZoom(zoom) {
      currentZoom = zoom;
      zoomValue.textContent = formatZoom(zoom);
      if (zoom === 1) {
        panX = 0;
        panY = 0;
      }
      clampPan();
      applyZoomAndPan();
    }
    function formatZoom(zoom) {
      return `${Number.isInteger(zoom) ? zoom : zoom.toFixed(1)}x`;
    }
    function startPan(event) {
      if (currentZoom === 1) {
        return;
      }
      isPanning = true;
      panStartX = event.clientX;
      panStartY = event.clientY;
      panOriginX = panX;
      panOriginY = panY;
      imageViewport.setPointerCapture(event.pointerId);
      imageViewport.classList.add('is-panning');
    }
    function movePan(event) {
      if (!isPanning) {
        return;
      }
      panX = panOriginX + event.clientX - panStartX;
      panY = panOriginY + event.clientY - panStartY;
      clampPan();
      applyZoomAndPan();
    }
    function endPan(event) {
      if (!isPanning) {
        return;
      }
      isPanning = false;
      if (imageViewport.hasPointerCapture(event.pointerId)) {
        imageViewport.releasePointerCapture(event.pointerId);
      }
      imageViewport.classList.remove('is-panning');
    }
    function clampPan() {
      const viewportRect = imageViewport.getBoundingClientRect();
      const maxX = (viewportRect.width * (currentZoom - 1)) / 2;
      const maxY = (viewportRect.height * (currentZoom - 1)) / 2;
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
    }
    function applyZoomAndPan() {
      imageElement.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
      imageViewport.classList.toggle('is-zoomed', currentZoom > 1);
    }
    function findClosestDistanceIndex(distances, previousDistance) {
      let closestIndex = 0;
      let closestDifference = Math.abs(distances[0] - previousDistance);
      distances.forEach((distance, index) => {
        const difference = Math.abs(distance - previousDistance);
        if (difference < closestDifference) {
          closestIndex = index;
          closestDifference = difference;
        }
      });
      return closestIndex;
    }
    function updateDistanceLabel(distance) {
      if (distance === 0) {
        distanceLabel.textContent = `Distance: ${distance.toFixed(1)} (mathematically lossless)`;
      } else if (distance <= 1) {
        distanceLabel.textContent = `Distance: ${distance.toFixed(1)} (visually lossless)`;
      } else {
        distanceLabel.textContent = `Distance: ${distance.toFixed(1)}`;
      }
    }
    loadImage(catalog.defaultImage); // Initialize with the default image
  }
});
