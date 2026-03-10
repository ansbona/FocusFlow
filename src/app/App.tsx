import { useState, useEffect } from "react";
import { FlowStateMeter } from "./components/FlowStateMeter";
import { SensorWidget } from "./components/SensorWidget";
import { PhysicalControls } from "./components/PhysicalControls";
import { FlowTimeline } from "./components/FlowTimeline";
import { SettingsPanel } from "./components/SettingsPanel";
import { AlertNotification } from "./components/AlertNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Clock, Play, Square } from "lucide-react";
import { Button } from "./components/ui/button";

// Mock data generation helpers
const generateHistory = (length: number, min: number, max: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min) + min));
};

function App() {
  // Session control state
  const [isSessionActive, setIsSessionActive] = useState(true);
  
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Sensor state
  const [blinkRate, setBlinkRate] = useState(18);
  const [movementLevel, setMovementLevel] = useState(35);
  const [blinkHistory, setBlinkHistory] = useState(() => generateHistory(20, 15, 25));
  const [movementHistory, setMovementHistory] = useState(() => generateHistory(20, 20, 50));
  
  // Flow state
  const [flowLevel, setFlowLevel] = useState(75);
  const [flowState, setFlowState] = useState<"flow" | "focus" | "fatigue" | "break">("flow");
  const [focusStreakSeconds, setFocusStreakSeconds] = useState(750); // 12m 30s
  
  // Physical controls state
  const [lightColor, setLightColor] = useState("#0EA5E9");
  const [lightBrightness, setLightBrightness] = useState(70);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Settings state
  const [blinkThreshold, setBlinkThreshold] = useState(25);
  const [movementThreshold, setMovementThreshold] = useState(60);
  
  // Alerts state
  const [alerts, setAlerts] = useState([
    {
      id: "1",
      type: "success" as const,
      message: "Great job! You've been in the flow for 15 minutes. Keep up the excellent work!",
    },
  ]);
  
  // Timeline data
  const [timelineSegments] = useState([
    {
      id: "1",
      state: "focus" as const,
      duration: 10,
      startTime: "2:00 PM",
      stats: { avgBlinkRate: 20, avgMovementLevel: 30 },
    },
    {
      id: "2",
      state: "flow" as const,
      duration: 15,
      startTime: "2:10 PM",
      stats: { avgBlinkRate: 18, avgMovementLevel: 25 },
    },
    {
      id: "3",
      state: "fatigue" as const,
      duration: 8,
      startTime: "2:25 PM",
      stats: { avgBlinkRate: 28, avgMovementLevel: 55 },
    },
    {
      id: "4",
      state: "break" as const,
      duration: 5,
      startTime: "2:33 PM",
      stats: { avgBlinkRate: 22, avgMovementLevel: 20 },
    },
    {
      id: "5",
      state: "flow" as const,
      duration: 12,
      startTime: "2:38 PM",
      stats: { avgBlinkRate: 19, avgMovementLevel: 28 },
    },
  ]);

  const currentSessionTime = 45; // Current position in the session

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);
  
  // Update focus streak when in flow state
  useEffect(() => {
    if (!isSessionActive) return;
    
    const streakInterval = setInterval(() => {
      if (flowState === "flow") {
        setFocusStreakSeconds(prev => prev + 1);
      }
    }, 1000);
    
    return () => clearInterval(streakInterval);
  }, [flowState, isSessionActive]);

  // Simulate real-time sensor updates
  useEffect(() => {
    if (!isSessionActive) return;
    
    const interval = setInterval(() => {
      // Update blink rate
      const newBlinkRate = Math.max(15, Math.min(35, blinkRate + (Math.random() - 0.5) * 4));
      setBlinkRate(Math.round(newBlinkRate));
      setBlinkHistory((prev) => [...prev.slice(1), Math.round(newBlinkRate)]);
      
      // Update movement level
      const newMovementLevel = Math.max(20, Math.min(80, movementLevel + (Math.random() - 0.5) * 10));
      setMovementLevel(Math.round(newMovementLevel));
      setMovementHistory((prev) => [...prev.slice(1), Math.round(newMovementLevel)]);
      
      // Determine flow state based on sensors
      let newFlowState: typeof flowState = "focus";
      let newFlowLevel = 70;
      
      if (newBlinkRate > blinkThreshold || newMovementLevel > movementThreshold) {
        newFlowState = "fatigue";
        newFlowLevel = 45;
      } else if (newBlinkRate < 20 && newMovementLevel < 35) {
        newFlowState = "flow";
        newFlowLevel = 85;
      } else {
        newFlowState = "focus";
        newFlowLevel = 70;
      }
      
      setFlowState(newFlowState);
      setFlowLevel(newFlowLevel);
      
      // Generate contextual alerts
      if (newFlowState === "fatigue" && Math.random() > 0.7) {
        const fatigueMessages = [
          "Slowing down? Try a deep breath.",
          "High blink rate detected. Consider a 2-minute break.",
          "Movement detected. A quick stretch might help.",
        ];
        const newAlert = {
          id: Date.now().toString(),
          type: "suggestion" as const,
          message: fatigueMessages[Math.floor(Math.random() * fatigueMessages.length)],
        };
        setAlerts((prev) => [...prev.slice(-2), newAlert]);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [blinkRate, movementLevel, blinkThreshold, movementThreshold, isSessionActive]);

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const getBlinkStatus = () => {
    if (blinkRate > blinkThreshold) return "alert";
    if (blinkRate > blinkThreshold - 5) return "warning";
    return "normal";
  };

  const getMovementStatus = () => {
    if (movementLevel > movementThreshold) return "alert";
    if (movementLevel > movementThreshold - 15) return "warning";
    return "normal";
  };
  
  // Format current time
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FocusFlow</h1>
              <p className="text-sm text-gray-600">Your Co-Pilot for Digital Learning</p>
            </div>
            <div className="flex items-center gap-6">
              {/* Session Control Button */}
              <Button
                onClick={() => setIsSessionActive(!isSessionActive)}
                variant={isSessionActive ? "destructive" : "default"}
                size="sm"
                className="gap-2"
              >
                {isSessionActive ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Session
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isSessionActive ? 'Live Session' : 'Session Paused'}
                </span>
              </div>
              {/* Real-time clock */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-lg font-semibold text-gray-800 tabular-nums">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Alerts Section */}
            {alerts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Alerts & Suggestions</h3>
                <AlertNotification alerts={alerts} onDismiss={handleDismissAlert} />
              </div>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Flow State Monitor - spans 1 column */}
              <div>
                <FlowStateMeter 
                  flowLevel={flowLevel} 
                  state={flowState} 
                  focusStreakSeconds={focusStreakSeconds}
                />
              </div>

              {/* Sensor Widgets - spans 2 columns */}
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                <SensorWidget
                  type="blink"
                  currentValue={blinkRate}
                  unit="BPM"
                  history={blinkHistory}
                  status={getBlinkStatus()}
                />
                <SensorWidget
                  type="movement"
                  currentValue={movementLevel}
                  unit="% Activity"
                  history={movementHistory}
                  status={getMovementStatus()}
                />
              </div>
            </div>

            {/* Timeline Section */}
            <FlowTimeline segments={timelineSegments} currentTime={currentSessionTime} />
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <PhysicalControls
              lightColor={lightColor}
              lightBrightness={lightBrightness}
              vibrationEnabled={vibrationEnabled}
              onLightColorChange={setLightColor}
              onLightBrightnessChange={setLightBrightness}
              onVibrationEnabledChange={setVibrationEnabled}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel
              blinkThreshold={blinkThreshold}
              movementThreshold={movementThreshold}
              onBlinkThresholdChange={setBlinkThreshold}
              onMovementThresholdChange={setMovementThreshold}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>FocusFlow respects your privacy. All sensor data stays on your device.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default App;