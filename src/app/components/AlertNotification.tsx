import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Coffee, Sparkles, X } from "lucide-react";

interface Alert {
  id: string;
  type: "info" | "suggestion" | "success";
  message: string;
}

interface AlertNotificationProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

const alertConfig = {
  info: {
    icon: AlertCircle,
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  suggestion: {
    icon: Coffee,
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  success: {
    icon: Sparkles,
    color: "#10B981",
    bgColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
};

export function AlertNotification({ alerts, onDismiss }: AlertNotificationProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl shadow-sm border-2 p-4 flex items-start gap-3"
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
              }}
            >
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {alert.message}
                </p>
              </div>

              <button
                onClick={() => onDismiss(alert.id)}
                className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
