# AI Image to Art Converter

Transform Your Images into Multiple Artistic Styles with Privacy-First Processing

## Features Comparison

| Previous Version | Current Enhanced Version |
|------------------|--------------------------|
| Basic button styling with minimal CSS | Modern, responsive design with gradient backgrounds and glass-morphism effects |
| Simple layout with basic centering | Fully responsive layout with proper visual hierarchy and spacing |
| Images hidden by default with display issues | Proper image visibility with enhanced preview containers and styling |
| Basic button interactions with no hover effects | Advanced button styling with hover effects, shadows, and smooth transitions |
| No loading indicators or user feedback | Clear loading indicators and enhanced user feedback mechanisms |
| Plain text with no visual enhancements | Enhanced typography with gradient text effects and proper font sizing |
| No mobile optimization | Fully responsive design that works on desktop, tablet, and mobile devices |
| Basic color scheme with limited visual appeal | Cohesive color scheme with unique colors for each artistic style |
| No visual separation between sections | Clear visual separation between sections with distinct backgrounds |
| Minimal user experience with basic functionality | Enhanced user experience with polished interface and intuitive design |

## Project Overview

This application transforms your images into various artistic styles including:
- Pencil Sketch
- Black & White
- Ghibli Art
- 3D Render
- Animation

All processing happens client-side in your browser for complete privacy.

## How to Use

1. Open the application in your browser
2. Upload an image or capture one with your camera
3. Select an artistic style
4. View and download your transformed image

## Technical Details

- Uses HTML5 Canvas API for image processing
- Client-side JavaScript for all transformations
- No server processing required for artistic conversions
- Python HTTP server for local development only

## Features

- **Pencil Sketch**: Converts images to realistic pencil sketch style
- **Black & White**: Creates high-contrast black and white versions
- **Ghibli Art**: Applies a Studio Ghibli-inspired color palette and softening effect
- **3D Rendering**: Simulates a 3D lighting effect with highlights and shadows

## How to Use

1. Open `index.html` in a web browser
2. Click "Choose Image" to upload an image file
3. Select one of the conversion styles:
   - Pencil Sketch
   - Black & White
   - Ghibli Art
   - 3D Render
4. View the converted image in the result section
5. Click "Download Result" to save the converted image

## Technical Details

The image processing is done entirely in the browser using the HTML5 Canvas API. No server-side processing is required, making this a completely client-side solution.

### Processing Techniques

- **Pencil Sketch**: Grayscale conversion with inversion to simulate sketch effect
- **Black & White**: Weighted grayscale with contrast adjustment
- **Ghibli Art**: Color enhancement with warm tone boosting and softening
- **3D Rendering**: Position-based lighting simulation with contrast adjustments

## Browser Support

This project works in all modern browsers that support the HTML5 Canvas API:
- Chrome 4+
- Firefox 3.6+
- Safari 4+
- Edge 12+
- Internet Explorer 9+

## True 3D Model Generation (Advanced Feature)

For true 3D model generation from images, a backend service using TripoSR is available in the `backend` directory.

### Setup Instructions:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend service:
   ```bash
   python app.py
   ```

4. The backend service will run on `http://localhost:5000`

When you select the "3D Render" option in the frontend, it will now communicate with the backend service to generate a true 3D model using TripoSR technology. The resulting OBJ file can be downloaded separately.

## Limitations

- Large images may take longer to process
- Results are simulated effects, not true AI processing
- Best results with photographs rather than illustrations
- True 3D model generation requires the backend service to be running

## Research References

This project utilizes several technologies and techniques based on academic research. Key references include:

### TensorFlow.js and BodyPix
- *BodyPix: Real-time Person Segmentation in the Browser with TensorFlow.js* - TensorFlow Blog (2019)
- *Fast Human Segmentation with BodyPix* - ResearchGate (2025)

### Neural Style Transfer
- *Image Style Transfer Using Convolutional Neural Networks* - Gatys et al., CVPR 2016
- *Neural Style Transfer for Image Stylization* - Various researchers (2024-2025)

### 3D Reconstruction (TripoSR)
- *TripoSR: Fast 3D Object Reconstruction from a Single Image* - ArXiv (2024)
- *TripoSR Technical Report* - Tripo AI and Stability AI (2024)

### Image Processing and Edge Detection
- *Automatic Image-Based Pencil Sketch Rendering* - JCST Journal
- *Automatic pencil sketch generation by using canny edges* - MVA Proceedings (2017)

## Future Improvements

- Integration with actual AI models for more realistic conversions
- Additional artistic styles
- Batch processing for multiple images
- Customizable parameters for each effect