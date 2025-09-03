
import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { DropzoneUploader } from "@/components/DropzoneUploader";
import { DuotoneCanvas } from "@/components/DuotoneCanvas";
import { ActionsBar } from "@/components/ActionsBar";
import { ReverseToggle } from "@/components/ReverseToggle";
import { ColorToggle } from "@/components/ColorToggle";
import { HalftoneToggle } from "@/components/HalftoneToggle";
import { Card } from "@/components/ui/card";

interface ProcessedImage {
  url: string;
  filename: string;
  dimensions: { width: number; height: number };
}

const Index = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [useClassicColors, setUseClassicColors] = useState(false);
  const [useHalftone, setUseHalftone] = useState(false);
  
  // Debounce the controls to prevent excessive processing
  const [debouncedIsReversed] = useDebounce(isReversed, 200);
  const [debouncedUseClassicColors] = useDebounce(useClassicColors, 200);
  const [debouncedUseHalftone] = useDebounce(useHalftone, 200);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    // Revoke previous processed image URL before setting new file
    setProcessedImage(prev => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
    setOriginalFile(file);
    setIsProcessing(true);
  }, []);

  const handleReverseToggle = useCallback((checked: boolean) => {
    setIsReversed(checked);
  }, []);

  const handleColorToggle = useCallback((useClassic: boolean) => {
    setUseClassicColors(useClassic);
  }, []);

  const handleHalftoneToggle = useCallback((checked: boolean) => {
    setUseHalftone(checked);
  }, []);

  const handleProcessingComplete = useCallback((url: string, dimensions: { width: number; height: number }) => {
    setProcessedImage(prev => {
      // Revoke previous URL before setting new one
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      
      return originalFile ? {
        url,
        filename: originalFile.name,
        dimensions
      } : null;
    });
    setIsProcessing(false);
  }, [originalFile]);

  const handleProcessingError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  }, []);

  const handleReset = useCallback(() => {
    setProcessedImage(prev => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
    setOriginalFile(null);
    setError(null);
    setIsProcessing(false);
    setIsReversed(false);
    setUseClassicColors(false);
    setUseHalftone(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setProcessedImage(prev => {
        if (prev?.url) {
          URL.revokeObjectURL(prev.url);
        }
        return null;
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-surface pb-safe">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-duotone bg-clip-text text-transparent mb-2 sm:mb-4">
            Brave Pink Hero Green 1312
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Pink × Green duotone. Local & private.
          </p>
          <p className="text-sm text-muted-foreground mt-2 px-2">
            Transform your photos with beautiful duotone effects and halftone patterns. All processing happens in your browser.
          </p>
          <p className="text-sm text-muted-foreground mt-1 px-2">
            Now with halftone gradation for comic book style effects — color-blind friendly options available.
          </p>
        </header>

        {/* Main content */}
        <main className="space-y-4 sm:space-y-8 pb-20 sm:pb-8">
          {!originalFile && !processedImage && (
            <Card className="p-4 sm:p-8 shadow-card mx-2 sm:mx-0">
              <DropzoneUploader onFileSelect={handleFileSelect} />
            </Card>
          )}

          {error && (
            <Card className="p-4 sm:p-6 border-destructive bg-destructive/5 mx-2 sm:mx-0">
              <div className="text-center">
                <p className="text-destructive font-medium mb-4">{error}</p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-h-[44px]"
                >
                  Try Again
                </button>
              </div>
            </Card>
          )}

          {originalFile && (
            <>
              <Card className="p-4 sm:p-6 shadow-card mx-2 sm:mx-0">
                <DuotoneCanvas
                  file={originalFile}
                  onProcessingComplete={handleProcessingComplete}
                  onProcessingError={handleProcessingError}
                  isProcessing={isProcessing}
                  isReversed={debouncedIsReversed}
                  useClassicColors={debouncedUseClassicColors}
                  useHalftone={debouncedUseHalftone}
                />
              </Card>
              
              {/* Controls - Mobile optimized */}
              <Card className="p-4 sm:p-6 shadow-card mx-2 sm:mx-0">
                <div className="space-y-4">
                  <ColorToggle
                    useClassicColors={useClassicColors}
                    onToggle={handleColorToggle}
                    disabled={isProcessing}
                  />
                  <HalftoneToggle
                    checked={useHalftone}
                    onCheckedChange={handleHalftoneToggle}
                    disabled={isProcessing}
                  />
                  <ReverseToggle
                    checked={isReversed}
                    onCheckedChange={handleReverseToggle}
                    disabled={isProcessing}
                  />
                </div>
              </Card>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 sm:mt-16 pt-8 border-t border-border px-2">
          <p className="text-sm text-muted-foreground">
            All processing happens locally in your browser. Your photos never leave your device.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            developed by <a 
              href="https://instagram.com/marjono__" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors underline"
            >
              marjono
            </a>
          </p>
        </footer>
        
        {/* Mobile spacer to prevent sticky download from covering footer */}
        <div className="h-20 sm:hidden" aria-hidden="true" />
      </div>

      {/* Sticky bottom bar for mobile */}
      {processedImage && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe sm:hidden">
          <div className="p-4 pb-6">
            <ActionsBar
              processedImage={processedImage}
              onReset={handleReset}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Desktop actions */}
      {processedImage && (
        <div className="hidden sm:block">
          <ActionsBar
            processedImage={processedImage}
            onReset={handleReset}
            isMobile={false}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
