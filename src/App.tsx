import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { Settings, History, Undo2, Plus, Sparkles, Flame } from "lucide-react";
import { WaterWave } from "./components/WaterWave";
import { SettingsModal } from "./components/SettingsModal";
import { HistoryDrawer, SipRecord } from "./components/HistoryDrawer";
import { CompactReminderPopup } from "./components/CompactReminderPopup";
import "./App.css";

// Declare electronAPI on window
declare global {
  interface Window {
    electronAPI?: {
      updateTrayTitle: (title: string) => void;
      sendNotification: (options: { title: string; body: string }) => void;
      triggerReminderPopup: () => void;
      hideWindow: () => void;
      expandToDashboard: () => void;
      onSetMode: (callback: (mode: "dashboard" | "reminder") => void) => () => void;
      quitApp: () => void;
    };
  }
}

export const App: React.FC = () => {
  // View mode: dashboard vs compact reminder popup
  const [viewMode, setViewMode] = useState<"dashboard" | "reminder">("dashboard");

  // Persistence state
  const [currentMl, setCurrentMl] = useState<number>(() => {
    const saved = localStorage.getItem("sipzen_current_ml") || localStorage.getItem("takesip_current_ml");
    return saved ? Number(saved) : 450;
  });

  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("sipzen_daily_goal") || localStorage.getItem("takesip_daily_goal");
    return saved ? Number(saved) : 2000;
  });

  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("sipzen_interval_min") || localStorage.getItem("takesip_interval_min");
    return saved ? Number(saved) : 45;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("sipzen_sound_enabled") ?? localStorage.getItem("takesip_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("sipzen_notif_enabled") ?? localStorage.getItem("takesip_notif_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [history, setHistory] = useState<SipRecord[]>(() => {
    const saved = localStorage.getItem("sipzen_history") || localStorage.getItem("takesip_history");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", timestamp: Date.now() - 1000 * 60 * 85, amount: 200 },
          { id: "2", timestamp: Date.now() - 1000 * 60 * 40, amount: 250 },
        ];
  });

  // Target wall-clock timestamp for next reminder
  const [targetTimestamp, setTargetTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem("sipzen_target_timestamp");
    const now = Date.now();
    if (saved && Number(saved) > now) {
      return Number(saved);
    }
    const initialTarget = now + (Number(localStorage.getItem("sipzen_interval_min") || 45)) * 60 * 1000;
    localStorage.setItem("sipzen_target_timestamp", initialTarget.toString());
    return initialTarget;
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
  });

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customMlInput, setCustomMlInput] = useState<string>("");
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);

  // Audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("./assets/Sip-Bubble-2.m4a");
  }, []);

  // Listen for mode changes from Electron main process
  useEffect(() => {
    if (window.electronAPI?.onSetMode) {
      const cleanup = window.electronAPI.onSetMode((mode) => {
        setViewMode(mode);
      });
      return cleanup;
    }
  }, []);

  const playSipSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio policy fallback
      });
    }
  }, [soundEnabled]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("sipzen_current_ml", currentMl.toString());
    localStorage.setItem("sipzen_daily_goal", dailyGoal.toString());
    localStorage.setItem("sipzen_interval_min", intervalMinutes.toString());
    localStorage.setItem("sipzen_sound_enabled", soundEnabled.toString());
    localStorage.setItem("sipzen_notif_enabled", notificationsEnabled.toString());
    localStorage.setItem("sipzen_history", JSON.stringify(history));
    localStorage.setItem("sipzen_target_timestamp", targetTimestamp.toString());

    // Update Tray Title in macOS top bar
    const percentage = Math.round((currentMl / dailyGoal) * 100);
    window.electronAPI?.updateTrayTitle(` 💧 ${percentage}%`);
  }, [currentMl, dailyGoal, intervalMinutes, soundEnabled, notificationsEnabled, history, targetTimestamp]);

  // Wall-Clock Hydration Timer
  useEffect(() => {
    const checkTimer = () => {
      const now = Date.now();
      const diff = Math.ceil((targetTimestamp - now) / 1000);

      if (diff <= 0) {
        // Trigger compact reminder popup on macOS!
        window.electronAPI?.triggerReminderPopup();
        setViewMode("reminder");
        setSecondsRemaining(0);

        // Send Notification
        if (notificationsEnabled) {
          window.electronAPI?.sendNotification({
            title: "Time for a sip! 💧",
            body: `You are at ${Math.round((currentMl / dailyGoal) * 100)}% of your daily water goal. Stay refreshed!`,
          });
        }

        // Play Sound
        playSipSound();

        // Schedule next target interval
        const nextTarget = Date.now() + intervalMinutes * 60 * 1000;
        setTargetTimestamp(nextTarget);
      } else {
        setSecondsRemaining(diff);
      }
    };

    checkTimer();
    const intervalId = setInterval(checkTimer, 1000);
    return () => clearInterval(intervalId);
  }, [targetTimestamp, intervalMinutes, notificationsEnabled, currentMl, dailyGoal, playSipSound]);

  // Handle adding water
  const handleAddSip = (amount: number, hideAfter = false) => {
    const newTotal = currentMl + amount;
    setCurrentMl(newTotal);

    const newRecord: SipRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      amount,
    };
    setHistory((prev) => [newRecord, ...prev]);

    playSipSound();

    // Reset countdown target timestamp on drink
    const nextTarget = Date.now() + intervalMinutes * 60 * 1000;
    setTargetTimestamp(nextTarget);

    if (hideAfter) {
      window.electronAPI?.hideWindow();
      setViewMode("dashboard");
    }

    // If reached or surpassed goal, celebrate!
    if (currentMl < dailyGoal && newTotal >= dailyGoal) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#38bdf8", "#0ea5e9", "#67e8f9", "#ffffff", "#3b82f6"],
      });
    }
  };

  const handleSnooze = () => {
    // Snooze by 5 minutes
    const snoozeTarget = Date.now() + 5 * 60 * 1000;
    setTargetTimestamp(snoozeTarget);
    window.electronAPI?.hideWindow();
    setViewMode("dashboard");
  };

  const handleExpandToDashboard = () => {
    window.electronAPI?.expandToDashboard();
    setViewMode("dashboard");
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const [lastRecord, ...rest] = history;
    setCurrentMl((prev) => Math.max(0, prev - lastRecord.amount));
    setHistory(rest);
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const record = history.find((h) => h.id === id);
    if (record) {
      setCurrentMl((prev) => Math.max(0, prev - record.amount));
      setHistory((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleResetToday = () => {
    setCurrentMl(0);
    setHistory([]);
    const nextTarget = Date.now() + intervalMinutes * 60 * 1000;
    setTargetTimestamp(nextTarget);
  };

  const handleUpdateInterval = (newMin: number) => {
    setIntervalMinutes(newMin);
    const nextTarget = Date.now() + newMin * 60 * 1000;
    setTargetTimestamp(nextTarget);
  };

  const handleTestReminder = () => {
    setIsSettingsOpen(false);
    // Hide window and trigger in 5 seconds
    window.electronAPI?.hideWindow();
    const testTarget = Date.now() + 5 * 1000;
    setTargetTimestamp(testTarget);
  };

  // Format seconds into MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const percentage = Math.min(Math.round((currentMl / dailyGoal) * 100), 100);
  const isCompleted = currentMl >= dailyGoal;

  // IF IN COMPACT REMINDER POPUP MODE
  if (viewMode === "reminder") {
    return (
      <CompactReminderPopup
        onDrink={(amt) => handleAddSip(amt, true)}
        onSnooze={handleSnooze}
        onExpand={handleExpandToDashboard}
        onClose={() => {
          window.electronAPI?.hideWindow();
          setViewMode("dashboard");
        }}
      />
    );
  }

  // REGULAR FULL DASHBOARD MODE
  return (
    <div className="takesip-window">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand">
          <img src="./assets/icon.png" alt="Sipzen" className="brand-icon" />
          <div className="brand-text">
            <h2>Sipzen</h2>
            <span className="brand-tag">Hydration Tracker</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="header-btn"
            onClick={() => setIsHistoryOpen(true)}
            title="View Sip History"
          >
            <History size={16} />
          </button>
          <button
            className="header-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Preferences"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="app-body">
        {/* Streak & Timer Banner */}
        <div className="streak-bar">
          <div className="streak-tag">
            <Flame size={14} className="flame-icon" />
            <span>3 Day Streak</span>
          </div>
          <div className="next-reminder">
            <span className="reminder-label">Next sip:</span>
            <span className="reminder-time">{formatTimer(secondsRemaining)}</span>
          </div>
        </div>

        {/* Liquid Water Gauge */}
        <WaterWave
          percentage={percentage}
          currentMl={currentMl}
          goalMl={dailyGoal}
          isCompleted={isCompleted}
        />

        {/* Quick Sip Buttons */}
        <div className="quick-actions-panel">
          <div className="quick-grid">
            <button
              className="sip-preset-btn"
              onClick={() => handleAddSip(150)}
            >
              <span className="preset-icon">🥤</span>
              <span className="preset-ml">+150 ml</span>
              <span className="preset-label">Small</span>
            </button>

            <button
              className="sip-preset-btn highlighted"
              onClick={() => handleAddSip(250)}
            >
              <span className="preset-icon">☕️</span>
              <span className="preset-ml">+250 ml</span>
              <span className="preset-label">Glass</span>
            </button>

            <button
              className="sip-preset-btn"
              onClick={() => handleAddSip(350)}
            >
              <span className="preset-icon">🧋</span>
              <span className="preset-ml">+350 ml</span>
              <span className="preset-label">Mug</span>
            </button>

            <button
              className="sip-preset-btn"
              onClick={() => handleAddSip(500)}
            >
              <span className="preset-icon">💧</span>
              <span className="preset-ml">+500 ml</span>
              <span className="preset-label">Bottle</span>
            </button>
          </div>

          {/* Custom and Undo Toolbar */}
          <div className="custom-toolbar">
            {isCustomInputVisible ? (
              <form
                className="custom-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = parseInt(customMlInput, 10);
                  if (val > 0) {
                    handleAddSip(val);
                    setCustomMlInput("");
                    setIsCustomInputVisible(false);
                  }
                }}
              >
                <input
                  type="number"
                  placeholder="e.g. 300"
                  autoFocus
                  className="custom-input"
                  value={customMlInput}
                  onChange={(e) => setCustomMlInput(e.target.value)}
                />
                <button type="submit" className="custom-submit-btn">
                  Add ml
                </button>
                <button
                  type="button"
                  className="custom-cancel-btn"
                  onClick={() => setIsCustomInputVisible(false)}
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                className="toolbar-btn secondary"
                onClick={() => setIsCustomInputVisible(true)}
              >
                <Plus size={14} />
                Custom ml
              </button>
            )}

            <button
              className="toolbar-btn undo"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo last sip"
            >
              <Undo2 size={14} />
              Undo
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="app-footer">
        <Sparkles size={12} className="sparkle-icon" />
        <span>Stay hydrated throughout your workday</span>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        dailyGoal={dailyGoal}
        onUpdateDailyGoal={setDailyGoal}
        intervalMinutes={intervalMinutes}
        onUpdateInterval={handleUpdateInterval}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => setNotificationsEnabled((prev) => !prev)}
        onResetToday={handleResetToday}
        onTestReminder={handleTestReminder}
        onQuit={() => window.electronAPI?.quitApp()}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDeleteRecord={handleDeleteHistoryRecord}
      />
    </div>
  );
};
export default App;
