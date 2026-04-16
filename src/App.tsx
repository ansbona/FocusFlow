import { useState, useEffect, useRef, useCallback } from "react";
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

// ─── Sound helpers (Web Audio API) ───────────────────────────────────────────

/**
 * Plays a soft two-tone chime for the "fatigue" threshold (blink rate 21-30).
 * Uses a sine wave at ~440 Hz with a gentle fade-out envelope.
 */
function playFatigueSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, ctx.currentTime);          // A4
  osc.frequency.setValueAtTime(520, ctx.currentTime + 0.15);   // slight rise

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05); // soft attack
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);     // gentle fade

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.65);
}

/**
 * Plays a more urgent two-pulse alert for the "critical" threshold (blink rate 31+).
 * Uses a higher-pitched tone with two short pulses.
 */
function playCriticalSound(ctx: AudioContext) {
  [0, 0.3].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime + delay);       // A5
    osc.frequency.setValueAtTime(660, ctx.currentTime + delay + 0.1); // dip

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.04);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.3);
  });
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Settings state
  const [blinkThreshold, setBlinkThreshold] = useState(30);
  const [movementThreshold, setMovementThreshold] = useState(60);

  // Alerts state
  const [alerts, setAlerts] = useState<{ id: string; type: "success" | "suggestion" | "info"; message: string }[]>([]);

  // ── Audio context (lazy-initialised on first user interaction) ──────────────
  const audioCtxRef = useRef<AudioContext | null>(null);

  /**
   * Returns (or lazily creates) the shared AudioContext.
   * Must be called from within a user-gesture handler OR after the user has
   * already interacted with the page at least once.
   */
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof AudioContext === "undefined" && typeof (window as any).webkitAudioContext === "undefined") {
      return null; // Browser doesn't support Web Audio API
    }
    if (!audioCtxRef.current) {
      const Ctx = AudioContext ?? (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    // Resume if suspended (required after autoplay policy restrictions)
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Unlock the audio context on the very first user interaction so subsequent
  // programmatic calls work without a gesture.
  useEffect(() => {
    const unlock = () => {
      getAudioContext();
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [getAudioContext]);

  // ── Track last played threshold to avoid replaying the same level ──────────
  // "none" | "fatigue" | "critical"
  const lastSoundLevel = useRef<"none" | "fatigue" | "critical">("none");

  // ── Alert + sound logic whenever blinkRate changes ─────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;

    let type: "success" | "suggestion" | "info";
    let message: string;
    let color: string;
    let newSoundLevel: "none" | "fatigue" | "critical";

    if (blinkRate >= 1 && blinkRate <= 20) {
      type = "success";
      message = "Great job! You've been in the flow. Keep up the excellent work!";
      color = "#00C896"; // Emerald - Normal
      newSoundLevel = "none";
    } else if (blinkRate >= 21 && blinkRate <= 30) {
      type = "info";
      message = "You're working hard! Take a moment to relax your eyes.";
      color = "#FBBF7C"; // Peach - Fatigue
      newSoundLevel = "fatigue";
    } else if (blinkRate >= 31) {
      type = "suggestion";
      message = "High blink rate detected! Please take a break to avoid eye strain.";
      color = "#ff0000"; // Red - Critical
      newSoundLevel = "critical";
    } else {
      return;
    }

    // Update LED colour
    setLightColor(color);

    // Show alert
    const newAlert = {
      id: Date.now().toString(),
      type,
      message,
    };
    setAlerts([newAlert]);

    // Play sound only when threshold level changes (avoid repeating on every tick)
    if (soundEnabled && newSoundLevel !== "none" && newSoundLevel !== lastSoundLevel.current) {
      const ctx = getAudioContext();
      if (ctx) {
        if (newSoundLevel === "fatigue") {
          playFatigueSound(ctx);
        } else if (newSoundLevel === "critical") {
          playCriticalSound(ctx);
        }
      }
    }

    // Reset sound cooldown when returning to normal
    if (newSoundLevel === "none") {
      lastSoundLevel.current = "none";
    } else {
      lastSoundLevel.current = newSoundLevel;
    }
  }, [blinkRate, isSessionActive, soundEnabled, getAudioContext]);

  // ── ESP32 blink listener ───────────────────────────────────────────────────
  useEffect(() => {
    const blinkRef = ref(database, 'blinkRate');
    const unsubscribe = onValue(blinkRef, (snapshot) => {
      if (!isSessionActive) return;
      const data = snapshot.val();
      if (data !== null && !isNaN(data)) {
        const newBlinkRate = parseInt(data);
        setBlinkRate(newBlinkRate);
        setBlinkHistory(prev => [...prev.slice(1), newBlinkRate]);

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

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
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
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <PhysicalControls
              lightColor={lightColor}
              lightBrightness={lightBrightness}
              soundEnabled={soundEnabled}
              onLightColorChange={setLightColor}
              onLightBrightnessChange={setLightBrightness}
              onSoundEnabledChange={setSoundEnabled}
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
            <p>FocusFlow - Live ESP32 Blink Data</p>
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