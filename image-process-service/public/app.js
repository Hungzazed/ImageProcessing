/**
 * Image Processing Service - Frontend Application
 * Handles file upload, processing options, pipeline status, and output preview
 */

// ===== DOM Elements =====
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const processBtn = document.getElementById('processBtn');
const processBtnText = document.getElementById('processBtnText');
const statusPanel = document.getElementById('statusPanel');
const emptyState = document.getElementById('emptyState');
const progressFill = document.getElementById('progressFill');
const stageList = document.getElementById('stageList');
const outputSection = document.getElementById('outputSection');
const outputImage = document.getElementById('outputImage');
const downloadBtn = document.getElementById('downloadBtn');
const toast = document.getElementById('toast');

// Filter chips
const filterChips = document.querySelectorAll('.filter-chip');
const inputQuality = document.getElementById('inputQuality');
const qualityValue = document.getElementById('qualityValue');

// ===== State =====
let selectedFile = null;
let selectedFilter = 'none';
let processedFileUrl = null;
let processedFileName = null;

// ===== Pipeline Stage Mapping =====
const PIPELINE_STAGES = [
  { key: 'upload', label: 'Uploading image...' },
  { key: 'input', label: 'Validating & loading...', serverName: 'InputStage' },
  { key: 'resize', label: 'Resizing image...', serverName: 'ResizeStage' },
  { key: 'filter', label: 'Applying filter...', serverName: 'FilterStage' },
  { key: 'watermark', label: 'Adding watermark...', serverName: 'WatermarkStage' },
  { key: 'compression', label: 'Compressing...', serverName: 'CompressionStage' },
  { key: 'output', label: 'Saving output...', serverName: 'OutputStage' },
];

// ===== Upload Area: Drag & Drop =====
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files[0]);
  }
});

// Click to select
selectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

// Remove file
removeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFile();
});

// ===== File Handling =====
function handleFileSelect(file) {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Unsupported file type. Use JPEG, PNG, WebP or GIF.', 'error');
    return;
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('File size exceeds 10MB limit.', 'error');
    return;
  }

  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewContainer.classList.add('visible');
    uploadArea.classList.add('has-file');
    uploadArea.querySelector('.upload-area__icon').style.display = 'none';
    uploadArea.querySelector('.upload-area__text').style.display = 'none';
    uploadArea.querySelector('.upload-area__hint').style.display = 'none';
    uploadArea.querySelector('.upload-area__btn').style.display = 'none';
  };
  reader.readAsDataURL(file);

  // Update info
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);

  // Enable process button
  processBtn.disabled = false;

  // Hide output if previously shown
  outputSection.classList.remove('visible');
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  previewContainer.classList.remove('visible');
  uploadArea.classList.remove('has-file');
  uploadArea.querySelector('.upload-area__icon').style.display = '';
  uploadArea.querySelector('.upload-area__text').style.display = '';
  uploadArea.querySelector('.upload-area__hint').style.display = '';
  uploadArea.querySelector('.upload-area__btn').style.display = '';
  processBtn.disabled = true;
}

// ===== Filter Chips =====
filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    filterChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    selectedFilter = chip.dataset.filter;
  });
});

// Set "None" as default active
document.querySelector('[data-filter="none"]').classList.add('active');

// ===== Quality Slider =====
inputQuality.addEventListener('input', (e) => {
  qualityValue.textContent = e.target.value;
});

// ===== Process Image =====
processBtn.addEventListener('click', processImage);

async function processImage() {
  if (!selectedFile) {
    showToast('Please select an image first.', 'error');
    return;
  }

  // Disable button & show loading
  processBtn.disabled = true;
  processBtn.classList.add('loading');
  processBtnText.textContent = 'Processing...';

  // Show status panel
  emptyState.style.display = 'none';
  statusPanel.classList.add('visible');
  outputSection.classList.remove('visible');
  resetStages();

  // Build form data
  const formData = new FormData();
  formData.append('image', selectedFile);

  const width = document.getElementById('inputWidth').value;
  const height = document.getElementById('inputHeight').value;
  const quality = inputQuality.value;
  const format = document.getElementById('inputFormat').value;
  const watermark = document.getElementById('inputWatermark').value;
  const watermarkPosition = document.getElementById('inputWatermarkPosition').value;

  if (width) formData.append('width', width);
  if (height) formData.append('height', height);
  if (selectedFilter && selectedFilter !== 'none') {
    formData.append('filter', selectedFilter);
  }
  formData.append('quality', quality);
  formData.append('format', format);
  if (watermark) {
    formData.append('watermarkText', watermark);
    formData.append('watermarkPosition', watermarkPosition);
  }

  // Animate upload stage
  activateStage('upload');
  updateProgress(8);

  try {
    // Simulate upload start delay for visual feedback
    await delay(300);
    completeStage('upload');
    updateProgress(14);

    // Animate through pipeline stages (simulated during API call)
    const stageAnimation = animateStagesSequentially();

    // Send API request
    const response = await fetch('/api/images/process', {
      method: 'POST',
      body: formData,
    });

    // Stop the animation
    stageAnimation.stop();

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Processing failed');
    }

    // Map server logs to UI stages
    applyServerLogs(result.data.logs);
    updateProgress(100);

    // Show output
    await delay(400);
    showOutput(result.data);

    showToast('Image processed successfully!', 'success');

  } catch (error) {
    console.error('Processing error:', error);
    showToast(error.message || 'Processing failed. Please try again.', 'error');

    // Mark remaining stages as failed
    const stages = stageList.querySelectorAll('.stage-item');
    stages.forEach((stage) => {
      if (stage.classList.contains('active')) {
        stage.classList.remove('active');
        stage.classList.add('failed');
        stage.querySelector('.stage-icon').textContent = '✗';
      }
    });

  } finally {
    processBtn.disabled = false;
    processBtn.classList.remove('loading');
    processBtnText.textContent = '⚡ Process Image';
  }
}

// ===== Stage Animation =====
function resetStages() {
  const stages = stageList.querySelectorAll('.stage-item');
  stages.forEach((stage) => {
    stage.classList.remove('active', 'completed', 'failed');
    stage.querySelector('.stage-icon').textContent = stage.querySelector('.stage-icon').textContent.replace(/[✓✗⟳]/g, '');
    const durationEl = stage.querySelector('[data-duration]');
    if (durationEl) durationEl.textContent = '';
  });
  progressFill.style.width = '0%';
}

function activateStage(key) {
  const item = stageList.querySelector(`[data-stage="${key}"]`);
  if (item) {
    item.classList.add('active');
    item.querySelector('.stage-icon').textContent = '⟳';
  }
}

function completeStage(key, duration) {
  const item = stageList.querySelector(`[data-stage="${key}"]`);
  if (item) {
    item.classList.remove('active');
    item.classList.add('completed');
    item.querySelector('.stage-icon').textContent = '✓';
    if (duration !== undefined) {
      const durationEl = item.querySelector('[data-duration]');
      if (durationEl) durationEl.textContent = `${duration}ms`;
    }
  }
}

function failStage(key) {
  const item = stageList.querySelector(`[data-stage="${key}"]`);
  if (item) {
    item.classList.remove('active');
    item.classList.add('failed');
    item.querySelector('.stage-icon').textContent = '✗';
  }
}

function animateStagesSequentially() {
  let currentIdx = 1; // Start after upload (index 0)
  let stopped = false;
  let progressVal = 14;

  const interval = setInterval(() => {
    if (stopped || currentIdx >= PIPELINE_STAGES.length) {
      clearInterval(interval);
      return;
    }

    const stage = PIPELINE_STAGES[currentIdx];
    activateStage(stage.key);

    // Complete the previous stage
    if (currentIdx > 1) {
      const prev = PIPELINE_STAGES[currentIdx - 1];
      completeStage(prev.key);
    }

    progressVal = Math.min(90, progressVal + 12);
    updateProgress(progressVal);

    currentIdx++;
  }, 350);

  return {
    stop: () => {
      stopped = true;
      clearInterval(interval);
    },
  };
}

function applyServerLogs(logs) {
  if (!logs) return;

  // Map server stage names to UI keys
  const stageMap = {
    InputStage: 'input',
    ResizeStage: 'resize',
    FilterStage: 'filter',
    WatermarkStage: 'watermark',
    CompressionStage: 'compression',
    OutputStage: 'output',
  };

  // First, complete upload stage
  completeStage('upload');

  // Process each log entry
  logs.forEach((log) => {
    const uiKey = stageMap[log.stage];
    if (!uiKey) return;

    if (log.status === 'completed') {
      completeStage(uiKey, log.duration);
    } else if (log.status === 'skipped') {
      completeStage(uiKey);
      const item = stageList.querySelector(`[data-stage="${uiKey}"]`);
      if (item) {
        const durationEl = item.querySelector('[data-duration]');
        if (durationEl) durationEl.textContent = 'skipped';
      }
    } else if (log.status === 'failed') {
      failStage(uiKey);
    }
  });
}

function updateProgress(percent) {
  progressFill.style.width = `${percent}%`;
}

// ===== Output Display =====
function showOutput(data) {
  const { outputPath, filename, metadata, processingTime } = data;

  // Set image
  outputImage.src = outputPath;
  processedFileUrl = outputPath;
  processedFileName = filename;

  // Set metadata
  document.getElementById('metaDimensions').textContent =
    `${metadata.width || '—'} × ${metadata.height || '—'} px`;
  document.getElementById('metaFormat').textContent =
    (metadata.format || '—').toUpperCase();
  document.getElementById('metaSize').textContent =
    metadata.size ? formatFileSize(metadata.size) : '—';
  document.getElementById('metaChannels').textContent =
    metadata.channels || '—';
  document.getElementById('metaAlpha').textContent =
    metadata.hasAlpha ? 'Yes' : 'No';
  document.getElementById('metaTime').textContent =
    processingTime || '—';

  // Show section
  outputSection.classList.add('visible');

  // Scroll to output
  setTimeout(() => {
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ===== Download =====
downloadBtn.addEventListener('click', () => {
  if (!processedFileUrl) return;

  const a = document.createElement('a');
  a.href = processedFileUrl;
  a.download = processedFileName || 'processed-image';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast('Download started!', 'info');
});

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;

  // Trigger reflow
  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ===== Utility Functions =====
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size < 10 ? 2 : 1)} ${units[i]}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
