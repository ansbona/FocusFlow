import { Lightbulb, Vibrate } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface PhysicalControlsProps {
  lightColor: string;
  lightBrightness: number;
  vibrationEnabled: boolean;
  onLightColorChange: (color: string) => void;
  onLightBrightnessChange: (value: number) => void;
  onVibrationEnabledChange: (enabled: boolean) => void;
}

const colorPresets = [
  { name: "Aqua", color: "#0EA5E9", category: "Focus" },
  { name: "Emerald", color: "#10B981", category: "Focus" },
  { name: "Peach", color: "#FB923C", category: "Relax" },
  { name: "Lavender", color: "#A78BFA", category: "Relax" },
];

export function PhysicalControls({
  lightColor,
  lightBrightness,
  vibrationEnabled,
  onLightColorChange,
  onLightBrightnessChange,
  onVibrationEnabledChange,
}: PhysicalControlsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">
      <h2 className="text-xl font-semibold text-gray-800">Physical Scaffolding Controls</h2>
      
      {/* Ambient Light Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Ambient Light</h3>
            <p className="text-xs text-gray-500">LED status indicator</p>
          </div>
        </div>

        <div className="space-y-4 pl-11">
          {/* Color Spectrum with Presets */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Color Palette</Label>
            
            {/* Visual Spectrum */}
            <div className="h-12 rounded-lg overflow-hidden mb-3" 
                 style={{
                   background: 'linear-gradient(to right, #0EA5E9, #10B981, #FB923C, #A78BFA)'
                 }}>
            </div>
            
            {/* Color Presets */}
            <div className="grid grid-cols-2 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onLightColorChange(preset.color)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    lightColor === preset.color
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: preset.color }}
                  />
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-700">
                      {preset.name}
                    </div>
                    <div className="text-xs text-gray-500">{preset.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm text-gray-700">Brightness</Label>
              <span className="text-sm text-gray-500">{lightBrightness}%</span>
            </div>
            <Slider
              value={[lightBrightness]}
              onValueChange={(values) => onLightBrightnessChange(values[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Live Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-3">Live Preview</p>
            <div
              className="w-full h-12 rounded-lg transition-all duration-500"
              style={{
                backgroundColor: lightColor,
                opacity: lightBrightness / 100,
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      {/* Vibration Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Vibrate className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Vibration Alerts</h3>
              <p className="text-xs text-gray-500">Status change notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{vibrationEnabled ? "On" : "Off"}</span>
            <Switch checked={vibrationEnabled} onCheckedChange={onVibrationEnabledChange} />
          </div>
        </div>

        <div className="pl-11">
          <p className="text-xs text-gray-500">
            Receive gentle vibration alerts when your focus state changes
          </p>
        </div>
      </div>
    </div>
  );
}