import { Settings, Eye, Move } from "lucide-react";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";

interface SettingsPanelProps {
  blinkThreshold: number;
  movementThreshold: number;
  onBlinkThresholdChange: (value: number) => void;
  onMovementThresholdChange: (value: number) => void;
}

export function SettingsPanel({
  blinkThreshold,
  movementThreshold,
  onBlinkThresholdChange,
  onMovementThresholdChange,
}: SettingsPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gray-100">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Sensor Calibration</h2>
          <p className="text-xs text-gray-500">Adjust baseline thresholds</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Blink Rate Threshold */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <Label className="text-sm font-medium text-gray-700">
              Baseline Blink Rate
            </Label>
          </div>
          <div className="pl-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Alert Threshold</span>
              <span className="font-medium text-gray-800">{blinkThreshold} BPM</span>
            </div>
            <Slider
              value={[blinkThreshold]}
              onValueChange={(values) => onBlinkThresholdChange(values[0])}
              min={15}
              max={35}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Higher threshold = less sensitive. Calibrate based on your natural blink rate.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Movement Threshold */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-green-600" />
            <Label className="text-sm font-medium text-gray-700">
              Baseline Head Movement
            </Label>
          </div>
          <div className="pl-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Alert Threshold</span>
              <span className="font-medium text-gray-800">{movementThreshold}%</span>
            </div>
            <Slider
              value={[movementThreshold]}
              onValueChange={(values) => onMovementThresholdChange(values[0])}
              min={30}
              max={80}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Higher threshold = less sensitive. Calibrate based on your typical movement patterns.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Info box */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            About Calibration
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            Everyone has unique baseline behaviors. These calibration settings help FocusFlow understand your personal patterns. 
            If you find you're getting too many alerts (or not enough), adjust these thresholds to match your individual needs.
          </p>
        </div>
      </div>
    </div>
  );
}