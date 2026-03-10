import { useState } from "react";
import { motion } from "motion/react";
import { Clock, TrendingUp, Coffee, Brain } from "lucide-react";

interface TimelineSegment {
  id: string;
  state: "flow" | "focus" | "fatigue" | "break";
  duration: number; // in minutes
  startTime: string;
  stats?: {
    avgBlinkRate?: number;
    avgMovementLevel?: number;
  };
}

interface FlowTimelineProps {
  segments: TimelineSegment[];
  currentTime: number; // current position in minutes
}

const stateConfig = {
  flow: {
    color: "#10B981",
    bgColor: "#D1FAE5",
    label: "Flow",
    icon: TrendingUp,
  },
  focus: {
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    label: "Focus",
    icon: Brain,
  },
  fatigue: {
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    label: "Fatigue",
    icon: Clock,
  },
  break: {
    color: "#0EA5E9",
    bgColor: "#E0F2FE",
    label: "Break",
    icon: Coffee,
  },
};

export function FlowTimeline({ segments, currentTime }: FlowTimelineProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  
  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
  
  // Generate time labels for the timeline
  const generateTimeLabels = () => {
    const labels = [];
    const startHour = 14; // 2:00 PM
    const startMinute = 0;
    
    for (let i = 0; i <= totalDuration; i += 10) {
      const totalMinutes = startMinute + i;
      const hour = startHour + Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      labels.push({
        time: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
        position: (i / totalDuration) * 100,
      });
    }
    return labels;
  };
  
  const timeLabels = generateTimeLabels();
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Flow Timeline</h2>
        <div className="text-sm text-gray-500">
          Session Duration: {totalDuration} minutes
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="mb-4">
        <div className="flex gap-1 h-16 rounded-lg overflow-hidden">
          {segments.map((segment) => {
            const widthPercent = (segment.duration / totalDuration) * 100;
            const config = stateConfig[segment.state];
            const Icon = config.icon;
            
            return (
              <motion.button
                key={segment.id}
                onClick={() => setSelectedSegment(segment.id)}
                className="relative group cursor-pointer"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: config.bgColor,
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute inset-0 opacity-60"
                  style={{ backgroundColor: config.color }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon className="w-6 h-6 text-white drop-shadow" />
                </div>
                {selectedSegment === segment.id && (
                  <motion.div
                    className="absolute inset-0 border-2"
                    style={{ borderColor: config.color }}
                    layoutId="selectedSegment"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Current time indicator */}
        <div className="relative h-2 mt-2">
          <motion.div
            className="absolute top-0 w-0.5 h-full bg-gray-800 rounded-full"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full" />
          </motion.div>
        </div>
        
        {/* Time labels */}
        <div className="relative h-6 mt-2">
          {timeLabels.map((label, index) => (
            <div
              key={index}
              className="absolute text-xs text-gray-500"
              style={{ left: `${label.position}%`, transform: 'translateX(-50%)' }}
            >
              {label.time}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {Object.entries(stateConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: config.color }}
              />
              <Icon className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Selected segment details */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 rounded-lg"
        >
          {(() => {
            const segment = segments.find((s) => s.id === selectedSegment);
            if (!segment) return null;
            const config = stateConfig[segment.state];
            const Icon = config.icon;
            
            return (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{config.label} Period</h4>
                    <p className="text-sm text-gray-500">
                      {segment.startTime} • {segment.duration} minutes
                    </p>
                  </div>
                </div>
                
                {segment.stats && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {segment.stats.avgBlinkRate !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Avg. Blink Rate</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {segment.stats.avgBlinkRate} BPM
                        </p>
                      </div>
                    )}
                    {segment.stats.avgMovementLevel !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Avg. Movement Level</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {segment.stats.avgMovementLevel}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}