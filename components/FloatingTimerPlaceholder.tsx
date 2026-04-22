import React from 'react';
import { ArrowDownToLine } from 'lucide-react';
import GlassCard from './ui/Card';

interface Props {
  onDock: () => void;
}

const FloatingTimerPlaceholder: React.FC<Props> = ({ onDock }) => (
    <GlassCard className="!p-8 text-center flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] relative">
        <ArrowDownToLine size={64} className="text-accent-cyan mb-6" />
        <h3 className="text-2xl font-bold text-white">Timer is floating.</h3>
        <p className="text-gray-400 mt-2 mb-8">Drag the timer anywhere on the screen.</p>
        <button 
            onClick={onDock} 
            className="px-6 py-3 rounded-lg bg-electric-blue hover:bg-opacity-80 text-white font-semibold transition-transform hover:scale-105 active:scale-100"
        >
            Dock Timer
        </button>
    </GlassCard>
);

export default FloatingTimerPlaceholder;
