import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="card p-6 flex flex-col" style={{ width: '400px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
        <h3 className="text-lg mb-4 text-white">Confirm Action</h3>
        <p className="text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={onCancel}>Cancel</button>
          <button className="btn-primary" style={{ backgroundColor: '#ef4444' }} onClick={() => { onConfirm(); onCancel(); }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
