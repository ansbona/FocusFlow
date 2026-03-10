import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Eye, Move } from "lucide-react";
import { motion } from "motion/react";

interface SensorWidgetProps {
  type: "blink" | "movement";
  currentValue: number;
  unit: string;
  history: number[];
  status: "normal" | "warning" | "alert";
}

const statusColors = {
  normal: "#10B981",
  warning: "#F59E0B",
  alert: "#EF4444",
};

export function SensorWidget({
  type,
  currentValue,
  unit,
  history,
  status,
}: SensorWidgetProps) {
  const Icon = type === "blink" ? Eye : Move;
  const title = type === "blink" ? "Blink Rate" : "Head Movement";
  
  const chartData = history.map((value, index) => ({
    index,
    value,
  }));

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${statusColors[status]}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: statusColors[status] }} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">Real-time monitoring</p>
          </div>
        </div>
        <motion.div
          key={currentValue}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-right"
        >
          <div className="text-2xl font-bold text-gray-800">{currentValue}</div>
          <div className="text-xs text-gray-500">{unit}</div>
        </motion.div>
      </div>

      {/* Show vertical bar for movement, line chart for blink */}
      {type === "movement" ? (
        <div className="h-16 flex items-end">
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden h-full flex items-end">
            <motion.div
              className="w-full rounded-t-lg"
              style={{ 
                backgroundColor: statusColors[status],
                height: `${currentValue}%`
              }}
              initial={{ height: 0 }}
              animate={{ height: `${currentValue}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      ) : (
        <div className="h-16 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis hide domain={[0, "dataMax + 10"]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={statusColors[status]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-2 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColors[status] }}
        />
        <span className="text-xs text-gray-600 capitalize">{status}</span>
      </div>
    </motion.div>
  );
}