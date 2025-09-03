
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, RotateCcw, Image } from "lucide-react";

interface ProcessedImage {
  url: string;
  filename: string;
  dimensions: { width: number; height: number };
}

interface ActionsBarProps {
  processedImage: ProcessedImage;
  onReset: () => void;
  isMobile?: boolean;
}

export const ActionsBar = ({ processedImage, onReset, isMobile = false }: ActionsBarProps) => {
  const [fileSize, setFileSize] = useState<number | null>(null);

  // Calculate actual file size
  useEffect(() => {
    const getFileSize = async () => {
      try {
        const response = await fetch(processedImage.url);
        const blob = await response.blob();
        setFileSize(blob.size);
      } catch (error) {
        console.error('Failed to get file size:', error);
        setFileSize(null);
      }
    };

    getFileSize();
  }, [processedImage.url]);

  const handleDownload = async () => {
    try {
      // Generate filename
      const originalName = processedImage.filename.replace(/\.[^/.]+$/, "");
      const downloadName = `${originalName}_brave-pink-hero-green-1312.png`;
      
      // Use the existing blob URL directly instead of fetching
      const link = document.createElement('a');
      link.href = processedImage.url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Calculating...';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  if (isMobile) {
    return (
      <div className="flex items-center justify-between gap-3">
        {/* Compact info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={processedImage.url}
              alt="Processed duotone image"
              className="w-12 h-12 object-cover rounded-lg shadow-sm border"
            />
            <div className="absolute -top-1 -right-1 p-0.5 bg-primary rounded-full">
              <Image className="w-2 h-2 text-primary-foreground" />
            </div>
          </div>
          
          <div className="text-left min-w-0 flex-1">
            <h4 className="font-medium text-foreground text-sm truncate">
              {processedImage.filename}
            </h4>
            <p className="text-xs text-muted-foreground">
              {processedImage.dimensions.width} × {processedImage.dimensions.height}px
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={onReset}
            className="min-h-[44px] px-3 text-white"
            style={{ backgroundColor: '#165027' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f3a1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#165027'}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="sr-only">Replace Photo</span>
          </Button>
          
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg min-h-[44px] px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Download</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
      {/* Preview and info */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={processedImage.url}
            alt="Processed duotone image"
            className="w-20 h-20 object-cover rounded-lg shadow-sm border"
          />
          <div className="absolute -top-2 -right-2 p-1 bg-primary rounded-full">
            <Image className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-left">
          <h4 className="font-semibold text-foreground">
            {processedImage.filename}
          </h4>
          <p className="text-sm text-muted-foreground">
            {processedImage.dimensions.width} × {processedImage.dimensions.height}px
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)} PNG
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <Button
          size="lg"
          onClick={onReset}
          className="flex items-center space-x-2 min-h-[44px] text-white"
          style={{ backgroundColor: '#165027' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f3a1c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#165027'}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Replace Photo</span>
        </Button>
        
        <Button
          size="lg"
          onClick={handleDownload}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center space-x-2 min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>Download PNG</span>
        </Button>
      </div>
    </div>
  );
};
