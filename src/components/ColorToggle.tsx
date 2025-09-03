import { Switch } from "@/components/ui/switch";

interface ColorToggleProps {
  useClassicColors: boolean;
  onToggle: (useClassic: boolean) => void;
  disabled?: boolean;
}

export const ColorToggle = ({ useClassicColors, onToggle, disabled = false }: ColorToggleProps) => {
  return (
    <div className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-lg transition-all duration-200 ${
      useClassicColors 
        ? 'bg-primary/5 border-primary/20' 
        : 'bg-card border-border'
    }`}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <label 
            htmlFor="color-toggle" 
            className="text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Color Palette
          </label>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
            useClassicColors 
              ? 'bg-primary/15 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {useClassicColors ? 'Classic' : 'Accessible'}
          </span>
        </div>
        <p 
          id="color-description" 
          className="text-xs text-muted-foreground"
        >
          {useClassicColors 
            ? 'Original pink and green color scheme' 
            : 'Color-blind friendly optimized palette'
          }
        </p>
      </div>
      <Switch
        id="color-toggle"
        checked={useClassicColors}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
        aria-describedby="color-description"
      />
    </div>
  );
};;