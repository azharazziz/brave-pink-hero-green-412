import { Switch } from "@/components/ui/switch";

interface ColorToggleProps {
  useClassicColors: boolean;
  onToggle: (useClassic: boolean) => void;
  disabled?: boolean;
}

export const ColorToggle = ({ useClassicColors, onToggle, disabled = false }: ColorToggleProps) => {
  return (
    <div className="flex items-center space-x-3 min-h-[44px]">
      <Switch
        id="color-toggle"
        checked={useClassicColors}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
        aria-describedby="color-description"
      />
      <div className="flex flex-col">
        <label 
          htmlFor="color-toggle" 
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          Classic colors
        </label>
        <p 
          id="color-description" 
          className="text-xs text-muted-foreground"
        >
          {useClassicColors ? 'Original pink/green shades' : 'Optimized color-blind friendly'}
        </p>
      </div>
    </div>
  );
};