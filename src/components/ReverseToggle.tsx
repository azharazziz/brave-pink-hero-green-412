
import { Switch } from "@/components/ui/switch";

interface ReverseToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ReverseToggle = ({ checked, onCheckedChange, disabled = false }: ReverseToggleProps) => {
  return (
    <div className="flex items-center space-x-3 min-h-[44px]">
      <Switch
        id="reverse-toggle"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
        aria-describedby="reverse-description"
      />
      <div className="flex flex-col">
        <label 
          htmlFor="reverse-toggle" 
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          Reverse duotone
        </label>
        <p 
          id="reverse-description" 
          className="text-xs text-muted-foreground"
        >
          {checked ? 'Pink shadows, Green highlights' : 'Green shadows, Pink highlights'}
        </p>
      </div>
    </div>
  );
};
