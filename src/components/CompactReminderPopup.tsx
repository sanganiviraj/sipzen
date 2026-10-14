import React from "react";
import { Maximize2, X } from "lucide-react";

interface CompactReminderPopupProps {
  onDrink: (amount: number) => void;
  onSnooze: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export const CompactReminderPopup: React.FC<CompactReminderPopupProps> = ({
  onDrink,
  onSnooze,
  onExpand,
  onClose,
}) => {
  return (
    <div className="compact-popup-container">
      {/* Popover Arrow pointing up to macOS Menu Bar icon */}
      <div className="compact-popup-arrow" />

      <div className="compact-popup-card">
        {/* Top small controls */}
        <div className="compact-popup-top">
          <button className="compact-icon-btn" onClick={onExpand} title="Open Full Dashboard">
            <Maximize2 size={13} />
          </button>
          <button className="compact-icon-btn" onClick={onClose} title="Dismiss">
            <X size={13} />
          </button>
        </div>

        {/* Central message */}
        <div className="compact-popup-content">
          <div className="compact-popup-line primary">
            <span className="compact-emoji">🥤</span>
            <span>Take a sip now!</span>
          </div>
          <div className="compact-popup-line secondary">
            <span className="compact-emoji">🚰</span>
            <span>Stay hydrated!</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="compact-popup-actions">
          <button className="compact-pill-btn snooze-btn" onClick={onSnooze}>
            Snooze
          </button>
          <button className="compact-pill-btn drink-btn" onClick={() => onDrink(250)}>
            💧 Drink 250ml
          </button>
        </div>
      </div>
    </div>
  );
};
