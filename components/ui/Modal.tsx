import React from 'react';
import { X } from 'lucide-react';
import GlassCard from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      <GlassCard 
        className="w-full max-w-5xl max-h-[90vh] flex flex-col !p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-bold text-white font-display">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-white/10 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </GlassCard>
    </div>
  );
};

export default Modal;