import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // in milliseconds (default 5000ms)
}

type ToastListener = (toasts: ToastItem[]) => void;

let toastsState: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toastsState]));
};

export const showToast = (message: string, type: ToastType = 'info', duration = 5000) => {
  const id = Math.random().toString(36).substring(2, 9);

  let resolvedType = type;
  if (type === 'info') {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('required')) {
      resolvedType = 'error';
    } else if (lower.includes('success') || lower.includes('approved') || lower.includes('queued') || lower.includes('granted') || lower.includes('promoted')) {
      resolvedType = 'success';
    } else if (lower.includes('please') || lower.includes('select')) {
      resolvedType = 'warning';
    }
  }

  const newToast: ToastItem = { id, message, type: resolvedType, duration };
  toastsState = [newToast, ...toastsState];
  notifyListeners();
};

export const removeToast = (id: string) => {
  toastsState = toastsState.filter((t) => t.id !== id);
  notifyListeners();
};

export const toast = {
  show: showToast,
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
};

// Global window.alert override
if (typeof window !== 'undefined') {
  window.alert = (msg?: any) => {
    showToast(String(msg ?? ''));
  };
}

const SingleToast: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item, onClose]);

  const getConfig = () => {
    switch (item.type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={18} color="#34d399" />,
          borderColor: 'rgba(52, 211, 153, 0.4)',
          progressBg: 'linear-gradient(90deg, #34d399, #059669)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(52, 211, 153, 0.25)',
        };
      case 'error':
        return {
          icon: <AlertCircle size={18} color="#f87171" />,
          borderColor: 'rgba(248, 113, 113, 0.4)',
          progressBg: 'linear-gradient(90deg, #f87171, #dc2626)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(248, 113, 113, 0.25)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={18} color="#fbbf24" />,
          borderColor: 'rgba(251, 191, 36, 0.4)',
          progressBg: 'linear-gradient(90deg, #fbbf24, #d97706)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(251, 191, 36, 0.25)',
        };
      case 'info':
      default:
        return {
          icon: <Info size={18} color="#a78bfa" />,
          borderColor: 'rgba(167, 139, 250, 0.4)',
          progressBg: 'linear-gradient(90deg, #a78bfa, #6366f1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(124, 58, 237, 0.25)',
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className="toast-card"
      style={{
        border: `1px solid ${config.borderColor}`,
        boxShadow: config.boxShadow,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {config.icon}
      </div>

      <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#fafafa', lineHeight: 1.4 }}>
        {item.message}
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#a1a1aa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fafafa';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#a1a1aa';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={16} />
      </button>

      <div
        className="toast-progress-bar"
        style={{
          background: config.progressBg,
          animationDuration: `${item.duration}ms`,
        }}
      />
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>(toastsState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((item) => (
        <SingleToast key={item.id} item={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>
  );
};
