

import React, { useState } from 'react';
import Modal from './ui/Modal';
import { MessageSquare, Mail, Newspaper, Briefcase, User } from 'lucide-react';

interface DistractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (distractionName: string) => void;
}

const DISTRACTION_CATEGORIES = [
  { name: 'Social Media', icon: <MessageSquare size={20} /> },
  { name: 'Email/Messages', icon: <Mail size={20} /> },
  { name: 'News', icon: <Newspaper size={20} /> },
  { name: 'Unrelated Work', icon: <Briefcase size={20} /> },
  { name: 'Personal', icon: <User size={20} /> },
];

const DistractionModal: React.FC<DistractionModalProps> = ({ isOpen, onClose, onLog }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  const handleLog = () => {
    if (selectedCategory === 'Other') {
      if (otherText.trim()) {
        onLog(otherText.trim());
        resetState();
      }
    } else if (selectedCategory) {
      onLog(selectedCategory);
      resetState();
    }
  };

  const resetState = () => {
    setSelectedCategory(null);
    setOtherText('');
    onClose();
  }

  const handleClose = () => {
      resetState();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log a Distraction">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">What pulled you away?</h3>
        <p className="text-gray-400 mb-6">Logging distractions helps you identify patterns and regain focus.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          {DISTRACTION_CATEGORIES.map(({ name, icon }) => (
            <button
              key={name}
              onClick={() => setSelectedCategory(name)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 active:scale-95 ${
                selectedCategory === name 
                ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan' 
                : 'bg-white/5 border-transparent hover:border-white/20 text-gray-300'
              }`}
            >
              {icon}
              <span className="text-sm font-medium">{name}</span>
            </button>
          ))}
          <button
              onClick={() => setSelectedCategory('Other')}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 active:scale-95 ${
                selectedCategory === 'Other' 
                ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan' 
                : 'bg-white/5 border-transparent hover:border-white/20 text-gray-300'
              }`}
            >
              <span className="font-bold text-2xl">...</span>
              <span className="text-sm font-medium">Other</span>
            </button>
        </div>

        {selectedCategory === 'Other' && (
          <div className="my-4 animate-dropdown-enter">
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Briefly describe the distraction..."
              className="w-full bg-black/20 p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-electric-blue"
              autoFocus
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all active:scale-95">
            Dismiss
          </button>
          <button 
            onClick={handleLog}
            disabled={!selectedCategory || (selectedCategory === 'Other' && !otherText.trim())}
            className="px-6 py-2 rounded-lg bg-electric-blue hover:bg-opacity-80 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Log Distraction
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DistractionModal;
