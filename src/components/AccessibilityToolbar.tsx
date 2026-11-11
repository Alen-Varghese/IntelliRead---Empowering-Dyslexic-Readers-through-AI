import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Type, Space, Sun } from "lucide-react";
import { useState } from "react";

interface AccessibilityToolbarProps {
  onFontChange: (font: string) => void;
  onLineHeightChange: (height: number) => void;
  onLetterSpacingChange: (spacing: number) => void;
  onContrastToggle: (highContrast: boolean) => void;
}

export const AccessibilityToolbar = ({
  onFontChange,
  onLineHeightChange,
  onLetterSpacingChange,
  onContrastToggle
}: AccessibilityToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [highContrast, setHighContrast] = useState(false);

  const handleLineHeightChange = (value: number[]) => {
    setLineHeight(value[0]);
    onLineHeightChange(value[0]);
  };

  const handleLetterSpacingChange = (value: number[]) => {
    setLetterSpacing(value[0]);
    onLetterSpacingChange(value[0]);
  };

  const handleContrastToggle = (checked: boolean) => {
    setHighContrast(checked);
    onContrastToggle(checked);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-110 transition-smooth"
        aria-label="Open accessibility settings"
        data-testid="accessibility-toggle"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 p-6 w-80 shadow-card border-2 animate-fade-in" data-testid="accessibility-toolbar">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Accessibility
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Close accessibility settings"
        >
          ×
        </button>
      </div>

      <div className="space-y-6">
        {/* Font Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Reading Font
          </Label>
          <Select onValueChange={onFontChange} defaultValue="inter">
            <SelectTrigger>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inter">Inter (Default)</SelectItem>
              <SelectItem value="opendyslexic">OpenDyslexic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Height Slider */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Space className="w-4 h-4" />
            Line Height: {lineHeight.toFixed(1)}
          </Label>
          <Slider
            value={[lineHeight]}
            onValueChange={handleLineHeightChange}
            min={1.2}
            max={2.5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Letter Spacing Slider */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Letter Spacing: {letterSpacing.toFixed(1)}px
          </Label>
          <Slider
            value={[letterSpacing]}
            onValueChange={handleLetterSpacingChange}
            min={0}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            High Contrast
          </Label>
          <Switch
            checked={highContrast}
            onCheckedChange={handleContrastToggle}
          />
        </div>
      </div>
    </Card>
  );
};
