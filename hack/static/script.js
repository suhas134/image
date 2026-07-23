const loaderOverlay = document.getElementById('loader-overlay');
const statusMessage = document.getElementById('status-message');
const cameraPanel = document.getElementById('camera-panel');
const openCameraButton = document.getElementById('open-camera');
const captureButton = document.getElementById('capture-photo');
const videoElement = document.getElementById('camera-video');
let cameraStream = null;

function showLoading() {
  loaderOverlay.classList.remove('hidden');
}

function hideLoading() {
  loaderOverlay.classList.add('hidden');
}

function showStatus(text) {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.classList.remove('hidden');
}

function hideStatus() {
  if (!statusMessage) return;
  statusMessage.classList.add('hidden');
}

async function postJson(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function handleResultResponse(json) {
  if (json.error) {
    hideLoading();
    showStatus(json.error);
    return;
  }
  sessionStorage.setItem('carbonResult', JSON.stringify(json));
  window.location.href = '/result';
}

function stopCamera() {
  if (cameraStream && cameraStream.getTracks) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
}

async function openCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoElement.srcObject = cameraStream;
    cameraPanel.classList.remove('hidden');
    hideStatus();
  } catch (err) {
    showStatus('Camera access denied or not available.');
  }
}

async function capturePhoto() {
  if (!videoElement || !videoElement.srcObject) {
    showStatus('Camera is not active.');
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/png');
  stopCamera();
  cameraPanel.classList.add('hidden');
  showLoading();
  const result = await postJson('/capture-image', { image_data: imageData });
  await handleResultResponse(result);
}

async function initIndexPage() {
  const manualForm = document.getElementById('manual-form');
  const uploadForm = document.getElementById('upload-form');

  if (manualForm) {
    manualForm.addEventListener('submit', async event => {
      event.preventDefault();
      hideStatus();
      showLoading();
      const formData = new FormData(manualForm);
      const payload = {
        transport_type: formData.get('transport_type'),
        transport_distance: Number(formData.get('transport_distance') || 0),
        electricity_usage: Number(formData.get('electricity_usage') || 0),
        food_habit: formData.get('food_habit')
      };
      const result = await postJson('/calculate', payload);
      await handleResultResponse(result);
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async event => {
      event.preventDefault();
      hideStatus();
      const imageFile = uploadForm.querySelector('input[name="image"]').files[0];
      if (!imageFile) {
        showStatus('Please choose an image to upload.');
        return;
      }
      showLoading();
      const formPayload = new FormData();
      formPayload.append('image', imageFile);
      const response = await fetch('/upload-image', {
        method: 'POST',
        body: formPayload
      });
      const result = await response.json();
      await handleResultResponse(result);
    });
  }

  if (openCameraButton) {
    openCameraButton.addEventListener('click', async () => {
      await openCamera();
    });
  }

  if (captureButton) {
    captureButton.addEventListener('click', async () => {
      await capturePhoto();
    });
  }
}

function initializeChart(id, labels, values, type, colors) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return null;
  return new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 12 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#334155' } } },
      scales: type === 'bar' ? {
        x: { grid: { display: false }, ticks: { color: '#334155' } },
        y: { grid: { color: 'rgba(148,163,184,0.18)' }, ticks: { color: '#334155' }, beginAtZero: true }
      } : {}
    }
  });
}

function renderResultPage() {
  const raw = sessionStorage.getItem('carbonResult');
  const noData = document.getElementById('no-data');
  const content = document.getElementById('result-content');
  if (!raw) {
    if (noData) noData.classList.remove('hidden');
    if (content) content.classList.add('hidden');
    return;
  }
  const data = JSON.parse(raw);
  if (!data) {
    if (noData) noData.classList.remove('hidden');
    if (content) content.classList.add('hidden');
    return;
  }

  if (noData) noData.classList.add('hidden');
  if (content) content.classList.remove('hidden');
  document.getElementById('object-name').textContent = data.object_name || 'Unknown';
  document.getElementById('carbon-value').textContent = `${data.carbon_value} kg CO2e`; 
  document.getElementById('yearly-value').textContent = `${data.yearly_value} kg CO2e`;
  document.getElementById('trees-required').textContent = `${data.trees_required} trees`;
  document.getElementById('recommendation').textContent = data.recommendation || 'Use more eco-friendly options.';
  document.getElementById('explanation').textContent = data.explanation || 'No explanation available.';
  document.getElementById('yearly-projection').textContent = `${data.yearly_value} kg CO2e`;

  const imageElement = document.getElementById('result-image');
  if (imageElement) {
    imageElement.src = data.image_data || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23626c7a" font-size="20">No image available</text></svg>';
  }

  initializeChart('pie-chart', data.pie_data.labels, data.pie_data.values, 'pie', ['#2563eb', '#d9e8ff']);
  initializeChart('bar-chart', data.bar_data.labels, data.bar_data.values, 'bar', ['#0f9d58', '#d14343']);
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/') {
    initIndexPage();
  }
  if (window.location.pathname === '/result') {
    renderResultPage();
  }
});
