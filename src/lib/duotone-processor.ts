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

// Halftone raster effect function - screen printing style with solid blocks
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
  const cellSize = 12; // Size of each raster cell
  const maxDotSize = cellSize * 0.85; // Maximum dot diameter
  const shadowThreshold = 0.2; // Below this = solid shadow
  const highlightThreshold = 0.8; // Above this = solid highlight
  
  // Create raster pattern with regular grid
  for (let gridY = 0; gridY < Math.ceil(height / cellSize); gridY++) {
    for (let gridX = 0; gridX < Math.ceil(width / cellSize); gridX++) {
      const startX = gridX * cellSize;
      const startY = gridY * cellSize;
      const endX = Math.min(startX + cellSize, width);
      const endY = Math.min(startY + cellSize, height);
      
      // Sample luminance in this cell
      let totalLuminance = 0;
      let sampleCount = 0;
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const pixelIndex = (y * width + x) * 4;
          const r = imageData[pixelIndex];
          const g = imageData[pixelIndex + 1];
          const b = imageData[pixelIndex + 2];
          
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          totalLuminance += luminance;
          sampleCount++;
        }
      }
      
      if (sampleCount > 0) {
        const avgLuminance = totalLuminance / sampleCount;
        
        // Normalize luminance with auto-contrast
        let normalizedLuminance = Math.max(0, Math.min(1, (avgLuminance - minLuminance) / luminanceRange));
        normalizedLuminance = enhanceContrast(normalizedLuminance);
        
        const centerX = startX + cellSize / 2;
        const centerY = startY + cellSize / 2;
        
        // Screen printing logic: solid blocks for extremes, halftone for midtones
        if (normalizedLuminance <= shadowThreshold) {
          // Solid shadow block - no dots needed, background is already shadow color
          continue;
        } else if (normalizedLuminance >= highlightThreshold) {
          // Solid highlight block
          ctx.fillStyle = `rgb(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b})`;
          ctx.fillRect(startX, startY, endX - startX, endY - startY);
        } else {
          // Halftone area - dots for gradation
          ctx.fillStyle = `rgb(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b})`;
          
          // Map midtone range to dot size (0.2-0.8 maps to 0-1)
          const midtoneRange = highlightThreshold - shadowThreshold;
          const midtonePosition = (normalizedLuminance - shadowThreshold) / midtoneRange;
          
          const dotSize = midtonePosition * maxDotSize;
          const radius = dotSize / 2;
          
          if (radius > 1) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
          }
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
