import React from 'react';
import { ExternalLink } from 'lucide-react';
import GlassCard from './ui/Card';

interface Props {
  onPopIn: () => void;
}

const PopOutTimerPlaceholder: React.FC<Props> = ({ onPopIn }) => (
    <GlassCard className="!p-8 text-center flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] relative">
        <ExternalLink size={64} className="text-accent-cyan mb-6" />
        <h3 className="text-2xl font-bold text-white">Timer is in a separate window.</h3>
        <p className="text-gray-400 mt-2 mb-8">Close the other window or click below to bring it back here.</p>
        <button 
            onClick={onPopIn} 
            className="px-6 py-3 rounded-lg bg-electric-blue hover:bg-opacity-80 text-white font-semibold transition-transform hover:scale-105 active:scale-100"
        >
            Bring Timer Back
        </button>
    </GlassCard>
);

export default PopOutTimerPlaceholder;
