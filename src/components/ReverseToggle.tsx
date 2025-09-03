
import { Switch } from "@/components/ui/switch";

interface ReverseToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ReverseToggle = ({ checked, onCheckedChange, disabled = false }: ReverseToggleProps) => {
  return (
    <div className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-lg transition-all duration-200 ${
      checked 
        ? 'bg-primary/5 border-primary/20' 
        : 'bg-card border-border'
    }`}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <label 
            htmlFor="reverse-toggle" 
            className="text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Color Mapping
          </label>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
            checked 
              ? 'bg-primary/15 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {checked ? 'Reversed' : 'Normal'}
          </span>
        </div>
        <p 
          id="reverse-description" 
          className="text-xs text-muted-foreground"
        >
          {checked 
            ? 'Pink for shadows, green for highlights' 
            : 'Green for shadows, pink for highlights'
          }
        </p>
      </div>
      <Switch
        id="reverse-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
        aria-describedby="reverse-description"
      />
    </div>
  );
};
