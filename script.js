// Add debugging at the top of the file
console.log('Script loaded successfully');

// DOM Elements - will be initialized in DOMContentLoaded
let imageUpload, imagePreview, previewContainer, resultImage, resultContainer, downloadBtn;
let loadingIndicator, rotating3DContainer, rotating3DImage;
let cameraBtn, cameraContainer, video, captureBtn, closeCameraBtn;
let pencilSketchBtn, blackWhiteBtn, ghibliBtn, threeDBtn, animationBtn;

function initializeDOM() {
    imageUpload = document.getElementById('imageUpload');
    imagePreview = document.getElementById('imagePreview');
    previewContainer = document.getElementById('previewContainer');
    resultImage = document.getElementById('resultImage');
    resultContainer = document.getElementById('resultContainer');
    downloadBtn = document.getElementById('downloadBtn');
    loadingIndicator = document.getElementById('loading');
    rotating3DContainer = document.getElementById('rotating3DContainer');
    rotating3DImage = document.getElementById('rotating3DImage');
    
    cameraBtn = document.getElementById('cameraBtn');
    cameraContainer = document.getElementById('cameraContainer');
    video = document.getElementById('video');
    captureBtn = document.getElementById('captureBtn');
    closeCameraBtn = document.getElementById('closeCameraBtn');
    
    pencilSketchBtn = document.getElementById('pencilSketchBtn');
    blackWhiteBtn = document.getElementById('blackWhiteBtn');
    ghibliBtn = document.getElementById('ghibliBtn');
    threeDBtn = document.getElementById('threeDBtn');
    animationBtn = document.getElementById('animationBtn');
}

console.log('DOM Elements will be initialized on DOMContentLoaded');

// Canvas for image processing
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Store original image data for consistent effect application
let originalImageData = null;

// Camera variables
let stream = null;

// State variables
let isImageLoaded = false;
let is3DMode = false;

// 3D Rotation variables
let isDragging = false;
let startX = 0;
let startY = 0;
let rotateX = 0;
let rotateY = 0;
let currentRotateX = 0;
let currentRotateY = 0;

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize DOM elements
    initializeDOM();
    
    // Event Listeners
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
        console.log('Image upload event listener added');
    }
    
    // Camera button event listener with additional safety checks
    if (cameraBtn) {
        cameraBtn.addEventListener('click', function() {
            console.log('Camera button clicked');
            openCamera();
        });
        console.log('Camera button event listener added');
    }
    

    
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
        console.log('Capture button event listener added');
    }
    
    if (closeCameraBtn) {
        closeCameraBtn.addEventListener('click', closeCamera);
        console.log('Close camera button event listener added');
    }
    
    if (pencilSketchBtn) {
        pencilSketchBtn.addEventListener('click', () => processImage('pencil'));
        console.log('Pencil sketch button event listener added');
    }
    
    if (blackWhiteBtn) {
        blackWhiteBtn.addEventListener('click', () => processImage('blackwhite'));
        console.log('Black & white button event listener added');
    }
    
    if (ghibliBtn) {
        ghibliBtn.addEventListener('click', () => processImage('ghibli'));
        console.log('Ghibli button event listener added');
    }
    
    if (threeDBtn) {
        threeDBtn.addEventListener('click', () => processImage('3d'));
        console.log('3D button event listener added');
    }
    
    if (animationBtn) {
        animationBtn.addEventListener('click', () => processImage('animation'));
        console.log('Animation button event listener added');
    }
    

    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadResult);
        console.log('Download button event listener added');
    }
    
    // Set up 3D rotation event listeners
    if (rotating3DContainer) {
        rotating3DContainer.addEventListener('mousedown', startDrag);
        rotating3DContainer.addEventListener('mousemove', drag);
        rotating3DContainer.addEventListener('mouseup', stopDrag);
        rotating3DContainer.addEventListener('mouseleave', stopDrag);
        console.log('3D rotation event listeners added');
    }
    
    console.log('All event listeners set up');
});

// Check camera permissions - Checks if camera permission has been granted
async function checkCameraPermission() {
    try {
        // Check for permission API support
        if (navigator.permissions && navigator.permissions.query) {
            const permissionStatus = await navigator.permissions.query({name: 'camera'});
            console.log('Camera permission status:', permissionStatus.state);
            return permissionStatus.state;
        }
        return 'unknown'; // Permission API not supported
    } catch (error) {
        console.log('Permission API not supported or error occurred:', error);
        return 'unknown';
    }
}

// Request camera access - Explicitly requests camera permission
async function requestCameraAccess() {
    try {
        console.log('Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        
        // Stop the stream immediately as we just needed to request permission
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        
        console.log('Camera permission granted');
        return true;
    } catch (error) {
        console.error('Camera permission denied:', error);
        return false;
    }
}



// Open camera - Accesses the user's webcam for image capture
async function openCamera() {
    console.log('Attempting to open camera');
    
    // Safety checks for required elements
    if (!cameraContainer || !video) {
        console.error('Camera elements not found');
        alert('Camera functionality is not properly initialized.');
        return;
    }
    
    try {
        // Stop any existing stream first
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        stream = null;
        
        // Hide file upload section and show camera container
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
        cameraContainer.style.display = 'block';
        
        // Check if media devices are supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Your browser does not support camera access. Please try a modern browser like Chrome, Firefox, or Edge.');
        }
        
        console.log('Checking camera permission status...');
        
        // Check for existing permissions
        const permissionState = await checkCameraPermission();
        
        if (permissionState === 'denied') {
            // Try to explicitly request permission
            const granted = await requestCameraAccess();
            if (!granted) {
                throw new Error('Camera permission has been denied. Please allow camera access in your browser settings.');
            }
        } else if (permissionState === 'prompt') {
            console.log('Permission prompt will be shown');
        } else if (permissionState === 'granted') {
            console.log('Camera permission already granted');
        }
        
        console.log('Requesting camera access...');
        
        // Get camera stream with proper permission handling for single photo capture only
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 15, max: 15 } // Lower frame rate for photo capture only
            },
            audio: false
        };
        
        // Ensure we're not recording video by disabling media recording
        console.log('Requesting camera access for photo capture only');
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('Camera access granted');
        // Set video source
        video.srcObject = stream;
        
        // Add a small delay to ensure video is ready
        setTimeout(() => {
            if (video && video.videoWidth > 0) {
                console.log('Video is ready with dimensions:', video.videoWidth, 'x', video.videoHeight);
            } else {
                console.log('Video may still be initializing...');
            }
        }, 500);
        
        // Add event listeners for video errors
        video.addEventListener('error', function(e) {
            console.error('Video error:', e);
            alert('Error with video feed. Please try again.');
        });
        
        // Handle video play event
        video.addEventListener('play', function() {
            console.log('Video is playing');
        });
        
        // Handle video loadeddata event
        video.addEventListener('loadeddata', function() {
            console.log('Video data loaded');
        });
        
    } catch (err) {
        console.error('Error accessing camera:', err);
        // Make sure to show the upload section again if camera fails
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
        if (cameraContainer) {
            cameraContainer.style.display = 'none';
        }
        
        // Provide specific error messages based on error type
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert('Camera access was denied. Please allow camera permission when prompted, or enable it in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
            alert('No camera was found or the requested camera settings are not available. Please check your camera connection.');
        } else if (err.name === 'NotReadableError') {
            alert('Could not access the camera. It might be in use by another application.');
        } else {
            alert('Could not access the camera. Please make sure you have a camera connected and have granted permission.\n\nError: ' + err.message);
        }
    }
}

// Capture photo from camera - Takes a snapshot from the webcam feed
// This function ensures only a single photo is captured, not video
function capturePhoto() {
    // Check if video is ready
    if (!video) {
        alert('Video element not found.');
        return;
    }
    
    // Check if video is ready to play
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        alert('Video is not ready yet. Please wait a moment and try again.');
        return;
    }
    
    // Additional check for video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        // Try to get dimensions from the video element itself
        const width = video.width || 640;
        const height = video.height || 480;
        
        if (width === 0 || height === 0) {
            alert('Could not determine video dimensions. Please try again.');
            return;
        }
    }
    
    // Create canvas to capture photo
    const photoCanvas = document.createElement('canvas');
    photoCanvas.width = video.videoWidth || video.width || 640;
    photoCanvas.height = video.videoHeight || video.height || 480;
    const photoCtx = photoCanvas.getContext('2d');
    
    // Fill canvas with black background in case of transparency issues
    photoCtx.fillStyle = '#000';
    photoCtx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
    
    // Draw video frame to canvas (this captures a single frame, not video)
    try {
        photoCtx.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);
    } catch (drawError) {
        console.error('Error drawing video frame to canvas:', drawError);
        alert('Error capturing photo. Please try again.');
        return;
    }
    
    // Convert to data URL
    let dataUrl;
    try {
        dataUrl = photoCanvas.toDataURL('image/png');
    } catch (e) {
        console.error('Error converting to data URL:', e);
        alert('Error processing photo. Please try again.');
        return;
    }
    
    // Set as image preview
    imagePreview.src = dataUrl;
    imagePreview.style.display = 'block';
    previewContainer.style.display = 'flex';
    
    // Also draw on processing canvas
    imagePreview.onload = function() {
        // Ensure natural dimensions are available
        if (imagePreview.naturalWidth === 0 || imagePreview.naturalHeight === 0) {
            console.error('Image has invalid dimensions');
            alert('Error loading captured image. Please try again.');
            return;
        }
        
        canvas.width = imagePreview.naturalWidth;
        canvas.height = imagePreview.naturalHeight;
        ctx.drawImage(imagePreview, 0, 0);
        
        // Store original image data for consistent effect application
        try {
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (imageDataError) {
            console.error('Error getting image data:', imageDataError);
            alert('Error processing image data. Please try again.');
            return;
        }
        
        // Show result container and download button
        resultContainer.style.display = 'block';
        downloadBtn.style.display = 'inline-block';
        
        // Set image loaded flag
        isImageLoaded = true;
    };
    
    // Handle image loading errors
    imagePreview.onerror = function() {
        console.error('Error loading captured image');
        alert('Error loading captured image. Please try again.');
    };
    
    // Close camera and show file upload section
    closeCamera();
    document.querySelector('.upload-section').style.display = 'block';
}

// Close camera - Stops the webcam stream and ensures no video recording
function closeCamera() {
    // Stop all tracks in the stream
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
            try {
                // Check if track is still active before stopping
                if (track.readyState === 'live') {
                    track.stop();
                    console.log('Stopped track:', track.kind, track.label);
                }
            } catch (e) {
                console.warn('Error stopping track:', track.kind, track.label, e);
            }
        });
        stream = null;
    }
    
    // Pause video to release resources
    if (video) {
        video.pause();
        video.srcObject = null;
        console.log('Video stream cleared');
    }
    
    // Hide camera container
    if (cameraContainer) {
        cameraContainer.style.display = 'none';
    }
    
    // Show file upload section
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
    
    console.log('Camera closed successfully');
}

// Show or hide loading indicator - Provides visual feedback during processing
function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
    disableButtons(show);
}

// Enable or disable all style buttons - Prevents user interaction during processing
function disableButtons(disable) {
    if (pencilSketchBtn) pencilSketchBtn.disabled = disable;
    if (blackWhiteBtn) blackWhiteBtn.disabled = disable;
    if (ghibliBtn) ghibliBtn.disabled = disable;
    if (threeDBtn) threeDBtn.disabled = disable;
    if (animationBtn) animationBtn.disabled = disable;

    if (cameraBtn) cameraBtn.disabled = disable;
}

// Handle image upload - Processes images selected from the user's device
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        imagePreview.onload = async function() {
            // Show the preview container and image
            if (previewContainer) previewContainer.style.display = 'flex';
            if (imagePreview) imagePreview.style.display = 'block';
            
            // Reset canvas size to match image
            canvas.width = imagePreview.naturalWidth;
            canvas.height = imagePreview.naturalHeight;
            
            // Draw image on canvas
            ctx.drawImage(imagePreview, 0, 0);
            
            // Store original image data for consistent effect application
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Show result container and download button
            if (resultContainer) resultContainer.style.display = 'block';
            if (downloadBtn) downloadBtn.style.display = 'inline-block';
            
            // Set image loaded flag
            isImageLoaded = true;
        };
        
        imagePreview.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Process image - Applies the selected artistic style to the image
async function processImage(style) {
    if (!isImageLoaded) {
        alert('Please upload an image first');
        return;
    }
    
    showLoading(true);
    
    try {
        // Hide 3D container by default
        if (rotating3DContainer) {
            rotating3DContainer.style.display = 'none';
        }
        
        // Reset canvas to original image before applying effect
        if (originalImageData) {
            ctx.putImageData(originalImageData, 0, 0);
        }
        
        // Apply the selected style
        switch(style) {
            case 'pencil':
                applyPencilSketch();
                break;
            case 'blackwhite':
                applyBlackAndWhite();
                break;
            case 'ghibli':
                applyGhibliStyle();
                break;
            case '3d':
                apply3DRender();
                break;
            case 'animation':
                applyAnimationEffect();
                break;

        }
        
        // Show the result image
        if (resultImage) {
            resultImage.style.display = 'block';
        }
        
        // Show download button
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try again.');
        showLoading(false);
    }
}

// Apply pencil sketch effect - Converts image to grayscale and inverts for sketch effect
function applyPencilSketch() {
    // Get image data from the original image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply grayscale conversion
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    
    // Put the grayscale image back
    ctx.putImageData(imageData, 0, 0);
    
    // Get the grayscale image
    const grayscaleImage = new Image();
    grayscaleImage.src = canvas.toDataURL();
    
    grayscaleImage.onload = function() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grayscale image
        ctx.drawImage(grayscaleImage, 0, 0);
        
        // Get inverted image data
        const invertedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const invertedData = invertedImageData.data;
        
        // Invert the grayscale image
        for (let i = 0; i < invertedData.length; i += 4) {
            invertedData[i] = 255 - invertedData[i];     // red
            invertedData[i + 1] = 255 - invertedData[i + 1]; // green
            invertedData[i + 2] = 255 - invertedData[i + 2]; // blue
        }
        
        // Put the inverted image back
        ctx.putImageData(invertedImageData, 0, 0);
        
        // Set result image
        if (resultImage) {
            resultImage.src = canvas.toDataURL();
        }
    };
}

// Apply black and white effect - Creates high-contrast black and white version
function applyBlackAndWhite() {
function applyGhibliStyle() {
    // Get image data from the original image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply Ghibli-style color enhancement
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Boost warm tones (red and yellow)
        r = Math.min(255, r * 1.2);
        g = Math.min(255, g * 1.1);
        
        // Slightly reduce blue for warmer feel
        b = Math.max(0, b * 0.9);
        
        // Apply softening effect
        const avg = (r + g + b) / 3;
        r = Math.round(avg * 0.3 + r * 0.7);
        g = Math.round(avg * 0.3 + g * 0.7);
        b = Math.round(avg * 0.3 + b * 0.7);
        
        // Set pixel values
        data[i] = r;     // red
        data[i + 1] = g; // green
        data[i + 2] = b; // blue
    }
    
    // Put the image back
    ctx.putImageData(imageData, 0, 0);
    
    // Set result image
    if (resultImage) {
        resultImage.src = canvas.toDataURL();
    }
}

// Bilateral filter for painting-like smoothness with edge preservation
function applyBilateralFilter(imageData, spatialRadius, colorRadius) {
    const w = imageData.width, h = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sumR = 0, sumG = 0, sumB = 0, weight = 0;
            const centerIdx = (y * w + x) * 4;
            const centerR = data[centerIdx], centerG = data[centerIdx + 1], centerB = data[centerIdx + 2];
            
            for (let dy = -spatialRadius; dy <= spatialRadius; dy++) {
                for (let dx = -spatialRadius; dx <= spatialRadius; dx++) {
                    const ny = Math.min(h - 1, Math.max(0, y + dy));
                    const nx = Math.min(w - 1, Math.max(0, x + dx));
                    const idx = (ny * w + nx) * 4;
                    
                    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                    const dr = r - centerR, dg = g - centerG, db = b - centerB;
                    const colorDist = Math.sqrt(dr*dr + dg*dg + db*db);
                    const spatialDist = Math.sqrt(dx*dx + dy*dy);
                    
                    const colorWeight = Math.exp(-(colorDist * colorDist) / (2 * colorRadius * colorRadius));
                    const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialRadius * spatialRadius));
                    const w = colorWeight * spatialWeight;
                    
                    sumR += r * w;
                    sumG += g * w;
                    sumB += b * w;
                    weight += w;
                }
            }
            
            output[centerIdx] = Math.round(sumR / weight);
            output[centerIdx + 1] = Math.round(sumG / weight);
            output[centerIdx + 2] = Math.round(sumB / weight);
        }
    }
    
    return new ImageData(output, w, h);
}

// Ghibli signature color grading: warm, rich, with depth
function applyGhibliColorGrade(imageData) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        
        // Warm lift in shadows and mids
        r = Math.min(255, r * 1.12 + 12);
        g = Math.min(255, g * 1.08 + 6);
        b = Math.max(0, b * 0.95 - 2);
        
        // Enhance color saturation through curves
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.round(lum * 0.15 + r * 0.85);
        g = Math.round(lum * 0.10 + g * 0.90);
        b = Math.round(lum * 0.20 + b * 0.80);
        
        output[i] = r; output[i + 1] = g; output[i + 2] = b;
    }
    
    return new ImageData(output, imageData.width, imageData.height);
}

// Enhance saturation for vibrant, lush appearance
function enhanceSaturation(imageData, factor) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        output[i] = Math.min(255, Math.round(lum + (r - lum) * factor));
        output[i + 1] = Math.min(255, Math.round(lum + (g - lum) * factor));
        output[i + 2] = Math.min(255, Math.round(lum + (b - lum) * factor));
    }
    
    return new ImageData(output, imageData.width, imageData.height);
}

// Add watercolor-like texture for hand-painted appearance
function addWatercolorTexture(imageData) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
        // Add organic noise that mimics watercolor bleeding
        const noise = (Math.random() - 0.5) * 15;
        const watercolorVariation = Math.sin(i * 0.001) * 8;
        
        output[i] = Math.max(0, Math.min(255, data[i] + noise + watercolorVariation));
        output[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.8 + watercolorVariation));
        output[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.6 + watercolorVariation * 0.5));
    }
    
    return new ImageData(output, imageData.width, imageData.height);
}

// Atmospheric depth with vignette and depth-of-field effect
function applyAtmosphericDepth(imageData, w, h) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const centerX = w * 0.5, centerY = h * 0.5;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const dx = x - centerX, dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
            
            // Vignette: darken edges for atmospheric depth
            const vignetteStrength = Math.pow(1 - dist * 0.7, 1.8);
            const atmosphericFade = 1 - dist * 0.15; // slight atmospheric haze
            
            output[idx] = Math.round(data[idx] * vignetteStrength * atmosphericFade);
            output[idx + 1] = Math.round(data[idx + 1] * vignetteStrength * atmosphericFade);
            output[idx + 2] = Math.round(data[idx + 2] * vignetteStrength * atmosphericFade);
        }
    }
    
    return new ImageData(output, w, h);
}

// Enhance edge definition for hand-drawn quality
function enhanceEdgeDefinition(imageData) {
    const w = imageData.width, h = imageData.height;
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    // Simple Sobel edge enhancement
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            let gx = 0, gy = 0;
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nidx = ((y + dy) * w + (x + dx)) * 4;
                    const lum = data[nidx] * 0.3 + data[nidx + 1] * 0.6 + data[nidx + 2] * 0.1;
                    gx += lum * (dx === 0 ? 2 : 1) * (dx > 0 ? 1 : -1);
                    gy += lum * (dy === 0 ? 2 : 1) * (dy > 0 ? 1 : -1);
                }
            }
            
            const edgeStrength = Math.sqrt(gx * gx + gy * gy) * 0.05;
            output[idx] = Math.max(0, Math.min(255, data[idx] - edgeStrength));
            output[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] - edgeStrength));
            output[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] - edgeStrength));
        }
    }
    
    return new ImageData(output, w, h);
}

// Add subtle film grain for organic texture
function addFilmGrain(imageData, intensity) {
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * intensity;
        output[i] = Math.max(0, Math.min(255, data[i] + grain));
        output[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain * 0.8));
        output[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain * 0.6));
    }
    
    return new ImageData(output, imageData.width, imageData.height);
}
// Apply 3D render effect - Simulates 3D lighting
function apply3DRender() {
    // Get image data from the original image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simulate 3D lighting effect
    for (let i = 0; i < data.length; i += 4) {
        // Calculate position-based lighting
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas.width;
        const y = Math.floor(pixelIndex / canvas.width);
        
        // Create lighting gradient (top-left light source)
        const lightX = canvas.width * 0.2;
        const lightY = canvas.height * 0.2;
        const distance = Math.sqrt(Math.pow(x - lightX, 2) + Math.pow(y - lightY, 2));
        const maxDistance = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
        const lightIntensity = 1 - (distance / maxDistance) * 0.7;
        
        // Apply lighting to pixel
        data[i] = Math.min(255, data[i] * lightIntensity * 1.2);     // red
        data[i + 1] = Math.min(255, data[i + 1] * lightIntensity * 1.1); // green
        data[i + 2] = Math.min(255, data[i + 2] * lightIntensity); // blue
    }
    
    // Put the image back
    ctx.putImageData(imageData, 0, 0);
    
    // Set result image
    if (resultImage) {
        resultImage.src = canvas.toDataURL();
    }
    
    // Show 3D rotation container
    if (rotating3DContainer) {
        rotating3DContainer.style.display = 'block';
    }
    if (rotating3DImage) {
        rotating3DImage.src = resultImage.src;
    }
    
    // Set 3D mode flag
    is3DMode = true;
}



// Download result - Allows user to save the converted image
function downloadResult() {
    if (!resultImage || !resultImage.src) {
        alert('No result image to download');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'artistic-conversion.png';
    link.href = resultImage.src;
    link.click();
}

// Apply animation effect - Creates a cartoon-like animated effect
function applyAnimationEffect() {
    // Get image data from the original image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply color enhancement and smoothing for animation
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Enhance colors for vibrant animation look
        r = Math.min(255, r * 1.15);
        g = Math.min(255, g * 1.2);
        b = Math.min(255, b * 1.05);
        
        // Apply saturation boost for more vivid colors
        const avg = (r + g + b) / 3;
        r = Math.round(avg * 0.1 + r * 0.9);
        g = Math.round(avg * 0.1 + g * 0.9);
        b = Math.round(avg * 0.1 + b * 0.9);
        
        // Apply subtle contrast enhancement
        const contrast = 1.2;
        r = Math.max(0, Math.min(255, ((r - 128) * contrast) + 128));
        g = Math.max(0, Math.min(255, ((g - 128) * contrast) + 128));
        b = Math.max(0, Math.min(255, ((b - 128) * contrast) + 128));
        
        // Set pixel values
        data[i] = r;     // red
        data[i + 1] = g; // green
        data[i + 2] = b; // blue
    }
    
    // Put the image back
    ctx.putImageData(imageData, 0, 0);
    
    // Set result image
    if (resultImage) {
        resultImage.src = canvas.toDataURL();
    }
}

// 3D Rotation Functions
function startDrag(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
}

function drag(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    rotateY = currentRotateY + deltaX * 0.5;
    rotateX = currentRotateX - deltaY * 0.5;
    
    if (rotating3DContainer) {
        const rotatingInner = rotating3DContainer.querySelector('.rotating-3d-inner');
        if (rotatingInner) {
            rotatingInner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
    }
}

function stopDrag() {
    isDragging = false;
    currentRotateX = rotateX;
    currentRotateY = rotateY;
}