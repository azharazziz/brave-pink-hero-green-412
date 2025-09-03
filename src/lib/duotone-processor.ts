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

// Professional rasterization pipeline with joined areas - follows traditional printing workflow
const applyRasterizationPipeline = (
  ctx: CanvasRenderingContext2D,
  originalImageData: Uint8ClampedArray,
  width: number,
  height: number,
  shadowColor: { r: number; g: number; b: number },
  highlightColor: { r: number; g: number; b: number },
  minLuminance: number,
  luminanceRange: number,
  brightness: number = 1.3,
  contrast: number = 1.0,
  cellSize: number = 8
) => {
  // Step 1: Create grayscale array for level adjustment
  const grayscaleData = new Float32Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < originalImageData.length; i += 4) {
    const r = originalImageData[i];
    const g = originalImageData[i + 1];
    const b = originalImageData[i + 2];
    
    // Calculate luminance using Rec. 709 formula
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const pixelIndex = Math.floor(i / 4);
    grayscaleData[pixelIndex] = luminance;
  }
  
  // Step 2: Adjust levels for brighter, clearer view
  const adjustedGrayscale = new Float32Array(width * height);
  for (let i = 0; i < grayscaleData.length; i++) {
    const originalValue = grayscaleData[i];
    
    // Normalize to 0-1 range with auto-contrast
    let normalized = Math.max(0, Math.min(1, (originalValue - minLuminance) / luminanceRange));
    
    // Apply adjustable brightness boost for clearer visibility
    normalized = normalized * brightness; // Use adjustable brightness
    normalized = Math.max(0, Math.min(1, normalized)); // Clamp to valid range
    
    // Apply enhanced contrast for cleaner separation
    normalized = enhanceContrast(normalized);
    
    // Apply additional contrast adjustment
    normalized = Math.pow(normalized, 1 / contrast); // Use adjustable contrast
    
    // Apply optimized levels adjustment for clearer view
    // Adjusted shadows and highlights for better visibility
    const shadows = 0.05; // Lower shadow threshold for more detail
    const highlights = 0.95; // Higher highlight threshold for brighter whites
    const gamma = 0.8; // Lower gamma for brighter midtones
    
    // Adjust input range with improved settings
    normalized = Math.max(0, Math.min(1, (normalized - shadows) / (highlights - shadows)));
    
    // Apply gamma correction for brighter midtones
    normalized = Math.pow(normalized, 1 / gamma);
    
    // Additional brightness boost in post-processing
    normalized = normalized * 1.1 + 0.05; // Slight lift and boost
    normalized = Math.max(0, Math.min(1, normalized)); // Final clamp
    
    adjustedGrayscale[i] = normalized * 255;
  }
  // Step 3: Create 45-degree raster pattern with joined areas
  const angle = Math.PI / 4; // 45 degrees for diamond orientation
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // Clear canvas to shadow color (background)
  ctx.fillStyle = `rgb(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b})`;
  ctx.fillRect(0, 0, width, height);
  
  // Create a threshold map to determine which areas should be highlight color
  const thresholdMap = new Uint8Array(width * height);
  const threshold = 127; // Mid-point threshold
  
  // First pass: Create threshold map based on adjusted grayscale
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      const value = adjustedGrayscale[pixelIndex];
      
      // Determine if this pixel should be highlight color based on raster pattern
      const rotatedX = (x - width / 2) * cos + (y - height / 2) * sin;
      const rotatedY = -(x - width / 2) * sin + (y - height / 2) * cos;
      
      const gridX = Math.floor(rotatedX / cellSize);
      const gridY = Math.floor(rotatedY / cellSize);
      
      // Create raster pattern based on grid position and luminance
      const cellOffsetX = rotatedX - gridX * cellSize;
      const cellOffsetY = rotatedY - gridY * cellSize;
      const distFromCenter = Math.sqrt(
        Math.pow(cellOffsetX - cellSize / 2, 2) + 
        Math.pow(cellOffsetY - cellSize / 2, 2)
      );
      
      // Use luminance to determine raster size within cell
      const normalizedValue = value / 255;
      const rasterRadius = (normalizedValue * cellSize) / 2;
      
      // Mark pixel as highlight if it's within the raster area for this luminance
      thresholdMap[pixelIndex] = (distFromCenter <= rasterRadius) ? 1 : 0;
    }
  }
  
  // Second pass: Apply morphological operations to join nearby areas
  const joinedMap = new Uint8Array(width * height);
  const kernelSize = Math.max(1, Math.floor(cellSize / 4)); // Size for joining nearby areas
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      let highlightCount = 0;
      let totalCount = 0;
      
      // Sample area around pixel
      for (let dy = -kernelSize; dy <= kernelSize; dy++) {
        for (let dx = -kernelSize; dx <= kernelSize; dx++) {
          const sampleX = x + dx;
          const sampleY = y + dy;
          
          if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
            const sampleIndex = sampleY * width + sampleX;
            if (thresholdMap[sampleIndex] === 1) highlightCount++;
            totalCount++;
          }
        }
      }
      
      // Join areas if enough neighboring pixels are highlight
      const ratio = highlightCount / totalCount;
      joinedMap[pixelIndex] = ratio > 0.3 ? 1 : 0; // 30% threshold for joining
    }
  }
  
  // Third pass: Render the joined areas
  const outputImageData = ctx.createImageData(width, height);
  const outputData = outputImageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      const dataIndex = pixelIndex * 4;
      
      if (joinedMap[pixelIndex] === 1) {
        // Highlight color (pink/green)
        outputData[dataIndex] = highlightColor.r;
        outputData[dataIndex + 1] = highlightColor.g;
        outputData[dataIndex + 2] = highlightColor.b;
        outputData[dataIndex + 3] = 255;
      } else {
        // Shadow color (green/pink)
        outputData[dataIndex] = shadowColor.r;
        outputData[dataIndex + 1] = shadowColor.g;
        outputData[dataIndex + 2] = shadowColor.b;
        outputData[dataIndex + 3] = 255;
      }
    }
  }
  
  // Put the processed image data back
  ctx.putImageData(outputImageData, 0, 0);
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
  useHalftone: boolean = false,
  rasterSettings?: { brightness: number; contrast: number; cellSize: number }
): Promise<ProcessingResult> => {
  return new Promise((resolve, reject) => {
    // Create image element to load the file
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const result = processImageOnCanvas(img, canvas, isReversed, useClassicColors, useHalftone, rasterSettings);
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

const processImageOnCanvas = (
  img: HTMLImageElement, 
  canvas: HTMLCanvasElement, 
  isReversed: boolean = false, 
  useClassicColors: boolean = false, 
  useHalftone: boolean = false,
  rasterSettings?: { brightness: number; contrast: number; cellSize: number }
): ProcessingResult => {
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
  
  // Step 2: Apply duotone effect with enhanced contrast or raster
  if (useHalftone) {
    // Get raster settings with defaults
    const brightness = rasterSettings?.brightness ?? 1.3;
    const contrast = rasterSettings?.contrast ?? 1.0;
    const cellSize = rasterSettings?.cellSize ?? 8;
    
    // Clear canvas to background color
    ctx.fillStyle = `rgb(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b})`;
    ctx.fillRect(0, 0, width, height);
    
    // Apply rasterization pipeline with adjustable parameters
    applyRasterizationPipeline(ctx, data, width, height, shadowColor, highlightColor, minLuminance, luminanceRange, brightness, contrast, cellSize);
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
