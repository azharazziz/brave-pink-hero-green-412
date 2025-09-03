// Duotone processing engine for Brave Pink Hero Green 1312
// Implements the exact algorithm specified: grayscale → auto-contrast → duotone mapping

// Duotone colors - optimized (color-blind friendly)
const OPTIMIZED_SHADOW_COLOR = { r: 22, g: 80, b: 39 };      // #165027 (Green)
const OPTIMIZED_HIGHLIGHT_COLOR = { r: 249, g: 159, b: 210 }; // #F99FD2 (Pink)

// Classic duotone colors (original)
const CLASSIC_SHADOW_COLOR = { r: 27, g: 96, b: 47 };        // #1b602f
const CLASSIC_HIGHLIGHT_COLOR = { r: 247, g: 132, b: 197 };  // #f784c5

const MAX_DIMENSION = 3000;

// Contrast enhancement function - applies S-curve to push values toward extremes
const enhanceContrast = (value: number): number => {
  // Apply power curve with exponent > 1 to increase contrast
  // Values closer to 0.5 get pushed further toward 0 or 1
  const exponent = 1.8; // Adjust this value to control contrast strength
  
  if (value < 0.5) {
    // Push darker values toward 0 (shadow)
    return Math.pow(value * 2, exponent) / 2;
  } else {
    // Push lighter values toward 1 (highlight)  
    return 1 - Math.pow((1 - value) * 2, exponent) / 2;
  }
};

// Halftone effect function - creates dot pattern based on luminance
const applyHalftoneEffect = (
  ctx: CanvasRenderingContext2D,
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  shadowColor: { r: number; g: number; b: number },
  highlightColor: { r: number; g: number; b: number },
  minLuminance: number,
  luminanceRange: number
) => {
  const dotSize = 8; // Base dot size in pixels
  const spacing = dotSize; // Space between dot centers
  
  // Set highlight color for dots
  ctx.fillStyle = `rgb(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b})`;
  
  // Process image in a grid pattern
  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      // Calculate average luminance in this cell
      let totalLuminance = 0;
      let pixelCount = 0;
      
      // Sample pixels in the current grid cell
      for (let dy = 0; dy < spacing && y + dy < height; dy++) {
        for (let dx = 0; dx < spacing && x + dx < width; dx++) {
          const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
          if (pixelIndex < imageData.length) {
            const r = imageData[pixelIndex];
            const g = imageData[pixelIndex + 1];
            const b = imageData[pixelIndex + 2];
            
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            totalLuminance += luminance;
            pixelCount++;
          }
        }
      }
      
      if (pixelCount > 0) {
        const avgLuminance = totalLuminance / pixelCount;
        
        // Normalize and enhance contrast
        let normalizedLuminance = Math.max(0, Math.min(1, (avgLuminance - minLuminance) / luminanceRange));
        normalizedLuminance = enhanceContrast(normalizedLuminance);
        
        // Calculate dot radius based on luminance (brighter = larger dots)
        const maxRadius = dotSize / 2;
        const dotRadius = normalizedLuminance * maxRadius;
        
        // Draw the dot if it has significant size
        if (dotRadius > 0.5) {
          ctx.beginPath();
          ctx.arc(x + spacing/2, y + spacing/2, dotRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }
};

interface ProcessingResult {
  processedCanvas: HTMLCanvasElement;
  dimensions: { width: number; height: number };
}

export const processDuotoneImage = async (
  file: File, 
  canvas: HTMLCanvasElement,
  isReversed: boolean = false,
  useClassicColors: boolean = false,
  useHalftone: boolean = false
): Promise<ProcessingResult> => {
  return new Promise((resolve, reject) => {
    // Create image element to load the file
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const result = processImageOnCanvas(img, canvas, isReversed, useClassicColors, useHalftone);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    // Load the image
    img.src = url;
  });
};

const processImageOnCanvas = (img: HTMLImageElement, canvas: HTMLCanvasElement, isReversed: boolean = false, useClassicColors: boolean = false, useHalftone: boolean = false): ProcessingResult => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  // Calculate dimensions (resize if needed)
  let { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight);
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Draw image to canvas
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Step 1: Convert to grayscale and find min/max luminance
  let minLuminance = 255;
  let maxLuminance = 0;
  
  // Calculate luminance and find min/max in a single pass to avoid stack overflow
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate luminance using Rec. 709 formula
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    // Update min/max
    if (luminance < minLuminance) minLuminance = luminance;
    if (luminance > maxLuminance) maxLuminance = luminance;
  }
  
  const luminanceRange = maxLuminance - minLuminance || 1; // Avoid division by zero
  
  // Determine colors based on color scheme and reverse setting
  const baseColors = useClassicColors 
    ? { shadow: CLASSIC_SHADOW_COLOR, highlight: CLASSIC_HIGHLIGHT_COLOR }
    : { shadow: OPTIMIZED_SHADOW_COLOR, highlight: OPTIMIZED_HIGHLIGHT_COLOR };
  
  const shadowColor = isReversed ? baseColors.highlight : baseColors.shadow;
  const highlightColor = isReversed ? baseColors.shadow : baseColors.highlight;
  
  // Step 2: Apply duotone effect with enhanced contrast or halftone
  if (useHalftone) {
    // Clear canvas to background color
    ctx.fillStyle = `rgb(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b})`;
    ctx.fillRect(0, 0, width, height);
    
    // Apply halftone effect
    applyHalftoneEffect(ctx, data, width, height, shadowColor, highlightColor, minLuminance, luminanceRange);
  } else {
    // Regular duotone processing
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Recalculate luminance for this pixel
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // Normalize luminance with auto-contrast (stretch to 0-1 range)
      let normalizedLuminance = Math.max(0, Math.min(1, (luminance - minLuminance) / luminanceRange));
      
      // Apply contrast enhancement curve (S-curve) to push values toward extremes
      // This makes shadows darker and highlights brighter for stronger duotone effect
      normalizedLuminance = enhanceContrast(normalizedLuminance);
      
      // Map to duotone colors
      data[i] = Math.round(shadowColor.r + normalizedLuminance * (highlightColor.r - shadowColor.r));     // R
      data[i + 1] = Math.round(shadowColor.g + normalizedLuminance * (highlightColor.g - shadowColor.g)); // G
      data[i + 2] = Math.round(shadowColor.b + normalizedLuminance * (highlightColor.b - shadowColor.b)); // B
      // Alpha channel (i + 3) remains unchanged
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
  }
  
  return {
    processedCanvas: canvas,
    dimensions: { width, height }
  };
};

const calculateDimensions = (originalWidth: number, originalHeight: number): { width: number; height: number } => {
  // If image is within limits, keep original size
  if (originalWidth <= MAX_DIMENSION && originalHeight <= MAX_DIMENSION) {
    return { width: originalWidth, height: originalHeight };
  }
  
  // Calculate scale factor to fit within MAX_DIMENSION
  const scale = MAX_DIMENSION / Math.max(originalWidth, originalHeight);
  
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale)
  };
};
