

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isHighlighted?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Select an option', isHighlighted = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
          setIsOpen(false);
      }
  }

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-black/20 p-2 rounded-md border text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-electric-blue transition-colors ${
            isHighlighted ? 'border-accent-cyan animate-border-glow' : 'border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className={selectedOption ? 'text-white' : 'text-gray-400'}>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-dark-card backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden animate-dropdown-enter"
        >
          {options.map(option => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleSelect(option.value)}}
              tabIndex={0}
              className={`flex items-center gap-2 p-2 text-sm cursor-pointer transition-colors ${value === option.value ? 'bg-electric-blue text-white' : 'text-gray-300 hover:bg-white/10'}`}
            >
              {option.icon}
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
