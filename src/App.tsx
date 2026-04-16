//to be moved
import { useState, useEffect } from "react";
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';  
import { FlowStateMeter } from "./app/components/FlowStateMeter";
import { SensorWidget } from "./app/components/SensorWidget";
import { PhysicalControls } from "./app/components/PhysicalControls";
import { FlowTimeline } from "./app/components/FlowTimeline";
import { SettingsPanel } from "./app/components/SettingsPanel";
import { AlertNotification } from "./app/components/AlertNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./app/components/ui/tabs";
import { Button } from "./app/components/ui/button";
import { Clock, Play, Square } from "lucide-react";

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
  const [movementLevel, setMovementLevel] = useState(0);
  const [blinkHistory, setBlinkHistory] = useState(() => generateHistory(20, 15, 25));
  const [movementHistory, setMovementHistory] = useState(() => generateHistory(20, 0, 5));
  
  // Flow state
  const [flowLevel, setFlowLevel] = useState(75);
  const [flowState, setFlowState] = useState<"flow" | "focus" | "fatigue" | "break">("flow");
  const [focusStreakSeconds, setFocusStreakSeconds] = useState(0);
  
  // Physical controls state
  const [lightColor, setLightColor] = useState("#0EA5E9");
  const [lightBrightness, setLightBrightness] = useState(70);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Settings state
  const [blinkThreshold, setBlinkThreshold] = useState(30);
  const [movementThreshold, setMovementThreshold] = useState(60);
  
  // Alerts state
  const [alerts, setAlerts] = useState([
    {
      id: "1",
      type: "success" as const,
      message: "Great job! You've been in the flow. Keep up the excellent work!",
    },
  ]);
  
  // Timeline data
  // const [timelineSegments] = useState([
  //   {
  //     id: "1",
  //     state: "focus" as const,
  //     duration: 10,
  //     startTime: "2:00 PM",
  //     stats: { avgBlinkRate: 20, avgMovementLevel: 30 },
  //   },
  //   {
  //     id: "2",
  //     state: "flow" as const,
  //     duration: 15,
  //     startTime: "2:10 PM",
  //     stats: { avgBlinkRate: 18, avgMovementLevel: 25 },
  //   },
  //   {
  //     id: "3",
  //     state: "fatigue" as const,
  //     duration: 8,
  //     startTime: "2:25 PM",
  //     stats: { avgBlinkRate: 28, avgMovementLevel: 55 },
  //   },
  //   {
  //     id: "4",
  //     state: "break" as const,
  //     duration: 5,
  //     startTime: "2:33 PM",
  //     stats: { avgBlinkRate: 22, avgMovementLevel: 20 },
  //   },
  //   {
  //     id: "5",
  //     state: "flow" as const,
  //     duration: 12,
  //     startTime: "2:38 PM",
  //     stats: { avgBlinkRate: 19, avgMovementLevel: 28 },
  //   },
  // ]);

  const currentSessionTime = 45;

  //ESP32 BLINK LISTENER 
  useEffect(() => {
    const blinkRef = ref(database, 'blinkRate');
    const unsubscribe = onValue(blinkRef, (snapshot) => {
      if (!isSessionActive) return;
      const data = snapshot.val();
      if (data !== null && !isNaN(data)) {
        const newBlinkRate = parseInt(data);
        setBlinkRate(newBlinkRate);
        setBlinkHistory(prev => [...prev.slice(1), newBlinkRate]);
        
        // Update flow state from real data
        if (newBlinkRate > blinkThreshold) {
          setFlowState("fatigue");
          setFlowLevel(45);
        } else if (newBlinkRate < 21) {
          setFlowState("flow");
          setFlowLevel(85);
        } else {
          setFlowState("focus");
          setFlowLevel(70);
        }
      }
    });
    return () => unsubscribe();
  }, [blinkThreshold, isSessionActive]);

  useEffect(() => {
    const movementRef = ref(database, 'headMovement');
    const unsubscribe = onValue(movementRef, (snapshot) => {
      if (!isSessionActive) return;
      const data = snapshot.val();
      if (data !== null && !isNaN(data)) {
        const newMovement = parseInt(data);
        setMovementLevel(newMovement);
        setMovementHistory(prev => [...prev.slice(1), newMovement]);
      }
    });
    return () => unsubscribe();
  }, [isSessionActive]);
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

  //SIMULATION - Blink 
  useEffect(() => {
    if (!isSessionActive) return;
    
    const interval = setInterval(() => {      
      // Alerts based on REAL blink data
      if (blinkRate > blinkThreshold && Math.random() > 0.8) {
        const fatigueMessages = [
          "High blink rate detected. Consider a 2-minute break.",
          "Fatigue detected. Try a deep breath.",
        ];
        const newAlert = {
          id: Date.now().toString(),
          type: "suggestion" as const,
          message: fatigueMessages[Math.floor(Math.random() * fatigueMessages.length)],
        };
        //setAlerts((prev) => [...prev.slice(-2), newAlert]);
      }
    }, 3000);  // Slower since blink is real-time
    
    return () => clearInterval(interval);
  }, [movementLevel, movementThreshold, isSessionActive, blinkRate, blinkThreshold]);

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const getBlinkStatus = () => {
    if (blinkRate > blinkThreshold) return "alert";
    if (blinkRate > blinkThreshold - 10) return "warning";
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
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  //JSX
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

          <TabsContent value="dashboard" className="space-y-6">
            {alerts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Alerts & Suggestions</h3>
                <AlertNotification alerts={alerts} onDismiss={handleDismissAlert} />
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <div>
                <FlowStateMeter 
                  flowLevel={flowLevel} 
                  state={flowState} 
                  focusStreakSeconds={focusStreakSeconds}
                />
              </div>

              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                {/* BLINK SENSOR SHOWS REAL ESP32 DATA */}
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

            {/* <FlowTimeline segments={timelineSegments} currentTime={currentSessionTime} /> */}
          </TabsContent>

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

      <footer className="mt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>FocusFlow - Live ESP32 Blink Data</p> {/* Updated footer */}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;