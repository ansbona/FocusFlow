import { Lightbulb, Volume2 } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface PhysicalControlsProps {
  lightColor: string;
  lightBrightness: number;
  soundEnabled: boolean;
  onLightColorChange: (color: string) => void;
  onLightBrightnessChange: (value: number) => void;
  onSoundEnabledChange: (enabled: boolean) => void;
}

const colorPresets = [
  { name: "Emerald", color: "#10B981", category: "Normal" },
  { name: "Peach", color: "#FB923C", category: "Moderate" },
  { name: "Red", color: "#ff0000", category: "Alert" },
];

export function PhysicalControls({
  lightColor,
  lightBrightness,
  soundEnabled,
  onLightColorChange,
  onLightBrightnessChange,
  onSoundEnabledChange,
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
            <div
              className="h-12 rounded-lg overflow-hidden mb-3"
              style={{
                background: "linear-gradient(to right, #0EA5E9, #10B981, #FB923C, #ff0000)",
              }}
            />

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
                    <div className="text-sm font-medium text-gray-700">{preset.name}</div>
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

      {/* Sound Alert Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Volume2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Sound Alerts</h3>
              <p className="text-xs text-gray-500">Status change notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{soundEnabled ? "On" : "Off"}</span>
            <Switch checked={soundEnabled} onCheckedChange={onSoundEnabledChange} />
          </div>
        </div>

        <div className="pl-11 space-y-2">
          <p className="text-xs text-gray-500">
            Receive soft audio alerts when your focus state changes
          </p>
          {/* Threshold legend */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700">1 – 20</p>
              <p className="text-xs text-emerald-600">Normal</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">No sound</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-50 border border-orange-100">
              <p className="text-xs font-semibold text-orange-700">21 – 30</p>
              <p className="text-xs text-orange-600">Fatigue</p>
              <p className="text-[10px] text-orange-500 mt-0.5">Soft tone</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs font-semibold text-red-700">31+</p>
              <p className="text-xs text-red-600">Critical</p>
              <p className="text-[10px] text-red-500 mt-0.5">Alert tone</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}