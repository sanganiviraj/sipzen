import React from "react";
import { X, Volume2, VolumeX, Bell, BellOff, RotateCcw, Power } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyGoal: number;
  onUpdateDailyGoal: (goal: number) => void;
  intervalMinutes: number;
  onUpdateInterval: (interval: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onResetToday: () => void;
  onTestReminder: () => void;
  onQuit: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dailyGoal,
  onUpdateDailyGoal,
  intervalMinutes,
  onUpdateInterval,
  soundEnabled,
  onToggleSound,
  notificationsEnabled,
  onToggleNotifications,
  onResetToday,
  onTestReminder,
  onQuit,
}) => {
  if (!isOpen) return null;

  const intervals = [1, 5, 15, 30, 45, 60];
  const goalPresets = [1500, 2000, 2500, 3000, 3500];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Preferences</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Daily Goal */}
          <div className="setting-group">
            <label className="setting-label">Daily Goal ({dailyGoal} ml)</label>
            <div className="pill-selector">
              {goalPresets.map((goal) => (
                <button
                  key={goal}
                  className={`pill-btn ${dailyGoal === goal ? "active" : ""}`}
                  onClick={() => onUpdateDailyGoal(goal)}
                >
                  {goal} ml
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Interval */}
          <div className="setting-group">
            <label className="setting-label">Reminder Frequency</label>
            <div className="pill-selector">
              {intervals.map((min) => (
                <button
                  key={min}
                  className={`pill-btn ${intervalMinutes === min ? "active" : ""}`}
                  onClick={() => onUpdateInterval(min)}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="setting-toggles">
            <div className="toggle-row">
              <div className="toggle-info">
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>Sip Sound Effects</span>
              </div>
              <button
                className={`switch-btn ${soundEnabled ? "on" : "off"}`}
                onClick={onToggleSound}
              >
                <div className="switch-knob" />
              </button>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                <span>Desktop Reminders</span>
              </div>
              <button
                className={`switch-btn ${notificationsEnabled ? "on" : "off"}`}
                onClick={onToggleNotifications}
              >
                <div className="switch-knob" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="settings-actions">
            <button
              className="action-btn secondary-btn"
              onClick={onTestReminder}
              title="Triggers reminder popup in 5 seconds to test"
            >
              <Bell size={14} />
              Test Popup (5s)
            </button>

            <button
              className="action-btn danger-outline"
              onClick={() => {
                if (window.confirm("Reset today's water intake back to 0 ml?")) {
                  onResetToday();
                  onClose();
                }
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <button
              className="action-btn danger-solid"
              onClick={onQuit}
            >
              <Power size={14} />
              Quit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
