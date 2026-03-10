import { motion } from "motion/react";
import { Brain, Timer } from "lucide-react";

interface FlowStateMeterProps {
  flowLevel: number; // 0-100
  state: "flow" | "focus" | "fatigue" | "break";
  focusStreakSeconds: number; // Total seconds in flow state
}

const stateConfig = {
  flow: {
    color: "#10B981",
    label: "In the Flow",
    description: "You're doing great! Keep going.",
  },
  focus: {
    color: "#3B82F6",
    label: "Focused",
    description: "You're concentrating well.",
  },
  fatigue: {
    color: "#F59E0B",
    label: "Fatigue Detected",
    description: "Consider taking a short break.",
  },
  break: {
    color: "#0EA5E9",
    label: "Break Time",
    description: "Rest and recharge.",
  },
};

export function FlowStateMeter({ flowLevel, state, focusStreakSeconds }: FlowStateMeterProps) {
  const config = stateConfig[state];
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (flowLevel / 100) * circumference;

  // Format focus streak time
  const minutes = Math.floor(focusStreakSeconds / 60);
  const seconds = focusStreakSeconds % 60;
  const streakDisplay = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Flow State Monitor</h2>
      
      <div className="relative w-64 h-64 mb-4">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="90"
            stroke="#E5E7EB"
            strokeWidth="16"
            fill="none"
          />
          {/* Progress circle with pulsing animation */}
          <motion.circle
            cx="128"
            cy="128"
            r="90"
            stroke={config.color}
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ 
              strokeDashoffset: offset,
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              strokeDashoffset: { duration: 1, ease: "easeOut" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Brain className="w-12 h-12 mb-2" style={{ color: config.color }} />
          </motion.div>
          <div className="text-4xl font-bold text-gray-800">{flowLevel}%</div>
          <div className="text-sm text-gray-500 mt-1">Flow Level</div>
        </div>
      </div>

      {/* Focus Streak Timer */}
      <motion.div
        className="mb-4 px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100"
        animate={{
          scale: state === "flow" ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: state === "flow" ? Infinity : 0,
        }}
      >
        <div className="flex items-center gap-2 justify-center">
          <Timer className="w-4 h-4 text-blue-600" />
          <div className="text-xs text-gray-600 font-medium">Current Focus Streak</div>
        </div>
        <div className="text-2xl font-bold text-center mt-1 text-gray-800">
          {streakDisplay}
        </div>
      </motion.div>

      {/* State label and description */}
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="text-lg font-semibold mb-1"
          style={{ color: config.color }}
        >
          {config.label}
        </div>
        <div className="text-sm text-gray-600">{config.description}</div>
      </motion.div>
    </div>
  );
}