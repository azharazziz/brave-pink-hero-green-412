
import { useEffect, useRef, useCallback } from "react";
import { processDuotoneImage } from "@/lib/duotone-processor";
import { Loader2 } from "lucide-react";

interface DuotoneCanvasProps {
  file: File;
  onProcessingComplete: (url: string, dimensions: { width: number; height: number }) => void;
  onProcessingError: (error: string) => void;
  isProcessing: boolean;
  isReversed?: boolean;
  useClassicColors?: boolean;
  useHalftone?: boolean;
}

export const DuotoneCanvas = ({ 
  file, 
  onProcessingComplete, 
  onProcessingError,
  isProcessing,
  isReversed = false,
  useClassicColors = false,
  useHalftone = false
}: DuotoneCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stabilize callbacks to prevent unnecessary re-processing
  const stableOnProcessingComplete = useCallback(onProcessingComplete, []);
  const stableOnProcessingError = useCallback(onProcessingError, []);

  useEffect(() => {
    let cancelled = false;

    const processImage = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !file || cancelled) return;

      try {
        const { processedCanvas, dimensions } = await processDuotoneImage(file, canvas, isReversed, useClassicColors, useHalftone);
        
        if (cancelled) return;
        
        // Convert canvas to blob and create URL
        processedCanvas.toBlob((blob) => {
          if (cancelled || !blob) return;
          
          const url = URL.createObjectURL(blob);
          stableOnProcessingComplete(url, dimensions);
        }, 'image/png', 0.92); // Slightly reduce quality for smaller files
        
      } catch (error) {
        if (cancelled) return;
        console.error('Processing error:', error);
        stableOnProcessingError(error instanceof Error ? error.message : "Failed to process image");
      }
    };

    processImage();
    
    return () => {
      cancelled = true;
    };
  }, [file, isReversed, useClassicColors, useHalftone, stableOnProcessingComplete, stableOnProcessingError]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Processing Image</h3>
        <p className="text-sm text-muted-foreground break-words px-2">
          {file.name} • {Math.round(file.size / 1024)}KB
        </p>
      </div>

      <div className="relative bg-muted rounded-lg overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-muted-foreground px-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">
                Applying {useHalftone ? 'halftone duotone' : 'duotone'} effect...
              </span>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-auto max-h-[50vh] sm:max-h-96 object-contain"
          style={{ display: 'block' }}
        />

        {!isProcessing && (
          <div className="absolute inset-0 processing-overlay pointer-events-none" />
        )}
      </div>

      {!isProcessing && (
        <div className="text-center text-sm text-muted-foreground px-2">
          <p>✨ {useHalftone ? 'Halftone duotone' : 'Duotone'} effect applied with {isReversed ? 'pink shadows and green highlights' : 'green shadows and pink highlights'}</p>
        </div>
      )}
    </div>
  );
};
