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

// ─── Types ────────────────────────────────────────────────────────────────────
type AlertType = "success" | "suggestion" | "info";
interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateHistory = (length: number, min: number, max: number): number[] =>
  Array.from({ length }, () => Math.floor(Math.random() * (max - min) + min));

// ─── Sound helpers (Web Audio API) ───────────────────────────────────────────
function playFatigueSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.setValueAtTime(520, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.65);
}

function playCriticalSound(ctx: AudioContext) {
  [0, 0.3].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
    osc.frequency.setValueAtTime(660, ctx.currentTime + delay + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.04);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.3);
  });
}

function playMovementWarningSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(360, ctx.currentTime);
  osc.frequency.setValueAtTime(420, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.55);
}

function playMovementAlertSound(ctx: AudioContext) {
  [0, 0.35].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(720, ctx.currentTime + delay);
    osc.frequency.setValueAtTime(560, ctx.currentTime + delay + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + delay + 0.04);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.32);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
function App() {
  // ── Session ────────────────────────────────────────────────────────────────
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // ── Sensors ────────────────────────────────────────────────────────────────
  const [blinkRate, setBlinkRate] = useState<number>(18);
  const [movementLevel, setMovementLevel] = useState<number>(0);
  const [blinkHistory, setBlinkHistory] = useState<number[]>(() => generateHistory(20, 15, 25));
  const [movementHistory, setMovementHistory] = useState<number[]>(() => generateHistory(20, 0, 5));

  // ── Flow ───────────────────────────────────────────────────────────────────
  const [flowLevel, setFlowLevel] = useState<number>(75);
  const [flowState, setFlowState] = useState<"flow" | "focus" | "fatigue" | "break">("flow");
  const [focusStreakSeconds, setFocusStreakSeconds] = useState<number>(0);

  // ── Physical controls ──────────────────────────────────────────────────────
  const [lightColor, setLightColor] = useState<string>("#0EA5E9");
  const [lightBrightness, setLightBrightness] = useState<number>(70);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // ── Settings ───────────────────────────────────────────────────────────────
  const [blinkThreshold, setBlinkThreshold] = useState<number>(30);
  const [movementThreshold, setMovementThreshold] = useState<number>(35);

  // ── Alerts ─────────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBlinkSoundLevel = useRef<"none" | "fatigue" | "critical">("none");
  const lastMovementSoundLevel = useRef<"none" | "warning" | "alert">("none");

  const getAudioContext = useCallback((): AudioContext | null => {
    if (
      typeof AudioContext === "undefined" &&
      typeof (window as any).webkitAudioContext === "undefined"
    )
      return null;
    if (!audioCtxRef.current) {
      const Ctx: typeof AudioContext =
        AudioContext ?? (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Unlock AudioContext on first user interaction
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

  // ── pushAlert: replaces prior alert from the same sensor ──────────────────
  const pushAlert = useCallback((id: string, type: AlertType, message: string) => {
    setAlerts((prev: AlertItem[]) => {
      const prefix = id.split("-")[0]; // "blink" | "movement"
      const filtered = prev.filter((a: AlertItem) => !a.id.startsWith(prefix));
      return [...filtered, { id, type, message }];
    });
  }, []);

  // ── Blink alert + sound ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;
    let type: AlertType;
    let message: string;
    let color: string;
    let newSoundLevel: "none" | "fatigue" | "critical";

    if (blinkRate >= 1 && blinkRate <= 20) {
      type = "success";
      message = "Blink rate normal — great focus! Keep it up.";
      color = "#00C896";
      newSoundLevel = "none";
    } else if (blinkRate >= 21 && blinkRate <= 30) {
      type = "info";
      message = "Blink rate rising (Warning) — take a moment to relax your eyes.";
      color = "#FBBF7C";
      newSoundLevel = "fatigue";
    } else if (blinkRate >= 31) {
      type = "suggestion";
      message = "High blink rate detected (Alert) — please take a break to avoid eye strain!";
      color = "#ff0000";
      newSoundLevel = "critical";
    } else {
      return;
    }

    setLightColor(color);
    pushAlert(`blink-${Date.now()}`, type, message);

    if (
      soundEnabled &&
      newSoundLevel !== "none" &&
      newSoundLevel !== lastBlinkSoundLevel.current
    ) {
      const ctx = getAudioContext();
      if (ctx) {
        if (newSoundLevel === "fatigue") playFatigueSound(ctx);
        else if (newSoundLevel === "critical") playCriticalSound(ctx);
      }
    }
    lastBlinkSoundLevel.current = newSoundLevel;
  }, [blinkRate, isSessionActive, soundEnabled, getAudioContext, pushAlert]);

  // ── Head movement alert + sound + flow impact ─────────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;
    const warningThreshold = movementThreshold - 15;
    let newSoundLevel: "none" | "warning" | "alert";

    if (movementLevel > movementThreshold) {
      pushAlert(
        `movement-${Date.now()}`,
        "suggestion",
        `Head movement Alert — excessive movement detected Please stabilise your posture.`
      );
      newSoundLevel = "alert";
      setFlowLevel((prev: number) => Math.max(prev - 20, 20));
      setFlowState("fatigue");
    } else if (movementLevel > warningThreshold) {
      pushAlert(
        `movement-${Date.now()}`,
        "info",
        `Head movement Warning — movement increasing Try to stay still.`
      );
      newSoundLevel = "warning";
      setFlowLevel((prev: number) => Math.max(prev - 8, 40));
      setFlowState("focus");
    } else {
      lastMovementSoundLevel.current = "none";
      return;
    }

    if (soundEnabled && newSoundLevel !== lastMovementSoundLevel.current) {
      const ctx = getAudioContext();
      if (ctx) {
        if (newSoundLevel === "warning") playMovementWarningSound(ctx);
        else if (newSoundLevel === "alert") playMovementAlertSound(ctx);
      }
    }
    lastMovementSoundLevel.current = newSoundLevel;
  }, [movementLevel, movementThreshold, isSessionActive, soundEnabled, getAudioContext, pushAlert]);

  // ── ESP32 blink listener ──────────────────────────────────────────────────
  useEffect(() => {
    const blinkRef = ref(database, 'blinkRate');
    const unsubscribe = onValue(blinkRef, (snapshot) => {
      if (!isSessionActive) return;
      const data = snapshot.val();
      if (data !== null && !isNaN(data)) {
        const newBlinkRate = parseInt(data, 10);
        setBlinkRate(newBlinkRate);
        setBlinkHistory((prev: number[]) => [...prev.slice(1), newBlinkRate]);
        setFlowLevel((prev: number) => {
          if (newBlinkRate > blinkThreshold) return Math.min(prev, 45);
          if (newBlinkRate < 21) return Math.max(prev, 75);
          return Math.max(prev, 60);
        });
        if (newBlinkRate > blinkThreshold) setFlowState("fatigue");
        else if (newBlinkRate < 21) setFlowState("flow");
        else setFlowState("focus");
      }
    });
    return () => unsubscribe();
  }, [blinkThreshold, isSessionActive]);

  // ── ESP32 movement listener ───────────────────────────────────────────────
  useEffect(() => {
    const movementRef = ref(database, 'headMovement');
    const unsubscribe = onValue(movementRef, (snapshot) => {
      if (!isSessionActive) return;
      const data = snapshot.val();
      if (data !== null && !isNaN(data)) {
        const newMovement = parseInt(data, 10);
        setMovementLevel(newMovement);
        setMovementHistory((prev: number[]) => [...prev.slice(1), newMovement]);
      }
    });
    return () => unsubscribe();
  }, [isSessionActive]);

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Focus streak ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;
    const id = setInterval(() => {
      if (flowState === "flow") setFocusStreakSeconds((prev: number) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [flowState, isSessionActive]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDismissAlert = (id: string) => {
    setAlerts((prev: AlertItem[]) => prev.filter((a: AlertItem) => a.id !== id));
  };

  const getBlinkStatus = (): "normal" | "warning" | "alert" => {
    if (blinkRate > blinkThreshold) return "alert";
    if (blinkRate > blinkThreshold - 10) return "warning";
    return "normal";
  };

  const getMovementStatus = (): "normal" | "warning" | "alert" => {
    if (movementLevel > movementThreshold) return "alert";
    if (movementLevel > movementThreshold - 15) return "warning";
    return "normal";
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
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
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSessionActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isSessionActive ? "Live Session" : "Session Paused"}
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {alerts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Alerts & Suggestions
                </h3>
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

          {/* Controls */}
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

          {/* Settings */}
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
            <p>FocusFlow — Live ESP32 Sensor Data</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;