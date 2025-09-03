import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HalftoneToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const HalftoneToggle = ({ checked, onCheckedChange, disabled }: HalftoneToggleProps) => {
  return (
    <div className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-lg transition-all duration-200 ${
      checked 
        ? 'bg-primary/5 border-primary/20' 
        : 'bg-card border-border'
    }`}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Label 
            htmlFor="halftone-toggle" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Processing Mode
          </Label>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
            checked 
              ? 'bg-primary/15 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {checked ? 'Simple' : 'Raster'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {checked 
            ? 'Basic duotone color mapping without texture'
            : 'Standard halftone processing with professional dot patterns'
          }
        </p>
      </div>
      <Switch
        id="halftone-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};