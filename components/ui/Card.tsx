import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  // Fix: Add onMouseMove prop to allow parent components to track mouse movement.
  onMouseMove?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, onMouseMove }) => {
  return (
    <div
      onClick={onClick}
      onMouseMove={onMouseMove}
      className={`bg-dark-card backdrop-blur-xl border rounded-2xl shadow-lg transition-all duration-300 group hover:border-white/20 animate-border-glow ${className}`}
    >
      <div className="relative w-full h-full">
         {children}
      </div>
    </div>
  );
};

export default GlassCard;
