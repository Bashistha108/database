import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      backgroundColor: '#ef4444', color: 'white', padding: '12px 20px',
      borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'white', padding: 0, display: 'flex' }}>
        <X size={16} />
      </button>
    </div>
  );
}
