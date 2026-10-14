import React from "react";
import { X, Clock, Trash2 } from "lucide-react";

export interface SipRecord {
  id: string;
  timestamp: number;
  amount: number;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SipRecord[];
  onDeleteRecord: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onDeleteRecord,
}) => {
  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card history-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex-row items-center gap-2">
            <Clock size={16} className="text-cyan" />
            <h3>Today's Sips</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">
              <span className="empty-icon">💧</span>
              <p>No sips recorded yet today.</p>
              <span className="empty-sub">Take a sip to start your log!</span>
            </div>
          ) : (
            history.map((record) => (
              <div key={record.id} className="history-row">
                <div className="history-time-box">
                  <span className="history-time">{formatTime(record.timestamp)}</span>
                </div>
                <div className="history-amount-badge">
                  +{record.amount} ml
                </div>
                <button
                  className="history-del-btn"
                  onClick={() => onDeleteRecord(record.id)}
                  title="Remove this entry"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
