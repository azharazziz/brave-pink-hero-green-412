import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RasterAdjustmentsProps {
  brightness: number;
  contrast: number;
  cellSize: number;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onCellSizeChange: (value: number) => void;
  disabled?: boolean;
}

export const RasterAdjustments = ({
  brightness,
  contrast,
  cellSize,
  onBrightnessChange,
  onContrastChange,
  onCellSizeChange,
  disabled
}: RasterAdjustmentsProps) => {
  return (
    <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-card">
      <h4 className="text-sm font-medium mb-3">Raster Adjustments</h4>
      
      {/* Brightness Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="brightness-slider" className="text-sm">
            Brightness
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round((brightness - 1) * 100)}%
          </span>
        </div>
        <Slider
          id="brightness-slider"
          min={0.5}
          max={2.0}
          step={0.1}
          value={[brightness]}
          onValueChange={(value) => onBrightnessChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Contrast Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="contrast-slider" className="text-sm">
            Contrast
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round((contrast - 1) * 100)}%
          </span>
        </div>
        <Slider
          id="contrast-slider"
          min={0.5}
          max={3.0}
          step={0.1}
          value={[contrast]}
          onValueChange={(value) => onContrastChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Cell Size Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="cellsize-slider" className="text-sm">
            Raster Size
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {cellSize}px
          </span>
        </div>
        <Slider
          id="cellsize-slider"
          min={4}
          max={16}
          step={1}
          value={[cellSize]}
          onValueChange={(value) => onCellSizeChange(value[0])}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
};
