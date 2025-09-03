import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HalftoneToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const HalftoneToggle = ({ checked, onCheckedChange, disabled }: HalftoneToggleProps) => {
  return (
    <div className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg bg-card">
      <div className="flex-1 space-y-1">
        <Label 
          htmlFor="halftone-toggle" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Halftone Effect
        </Label>
        <p className="text-xs text-muted-foreground">
          Apply dot pattern for comic book style gradation
        </p>
      </div>
      <Switch
        id="halftone-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
};