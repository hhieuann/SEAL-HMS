import React from 'react';
import { X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning", requireInput = "" }) => {
  const [inputValue, setInputValue] = React.useState('');
  
  React.useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isError = type === 'error' || type === 'danger';
  const headerBg = isError ? 'rgba(239, 68, 68, 0.1)' : type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';
  const headerColor = isError ? '#EF4444' : type === 'warning' ? '#F59E0B' : 'var(--primary)';
  const btnBg = isError ? '#EF4444' : type === 'warning' ? 'var(--warning)' : 'var(--primary)';

  const isConfirmDisabled = requireInput && inputValue !== requireInput;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel animate-scale-up" style={{ width: '400px', maxWidth: '90vw', padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 24px',
          background: headerBg,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: headerColor }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '24px', color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.5' }}>
          {message}
          
          {requireInput && (
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Type <strong>{requireInput}</strong> to confirm:
              </label>
              <input 
                type="text" 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                autoComplete="off"
              />
            </div>
          )}
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onConfirm ? (
            <>
              <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '500' }}>
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }} 
                disabled={isConfirmDisabled}
                className="btn btn-primary" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontWeight: '500', 
                  background: btnBg, 
                  color: '#fff', 
                  border: 'none',
                  opacity: isConfirmDisabled ? 0.5 : 1,
                  cursor: isConfirmDisabled ? 'not-allowed' : 'pointer'
                }}>
                {confirmText}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '500' }}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
