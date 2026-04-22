import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText: string;
  children: React.ReactNode;
  prompt?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, confirmText, children, prompt }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const canConfirm = !prompt || inputValue === prompt;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-gray-300">
        <div className="flex items-start gap-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-400 mt-1 flex-shrink-0" />
          <div>
            {children}
          </div>
        </div>
        
        {prompt && (
          <div className="mt-4">
            <label htmlFor="confirm-prompt" className="block text-sm font-medium mb-1">
              To confirm, please type "<strong className="text-white">{prompt}</strong>" below:
            </label>
            <input
              id="confirm-prompt"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-black/20 p-2 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all active:scale-95">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
