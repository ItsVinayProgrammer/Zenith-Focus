import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, min = 1, max = 999, step = 1, label }) => {
    const handleIncrement = () => {
        onChange(Math.min(max, value + step));
    };

    const handleDecrement = () => {
        onChange(Math.max(min, value - step));
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = parseInt(e.target.value, 10);
        if (!isNaN(numValue)) {
            onChange(Math.max(min, Math.min(max, numValue)));
        } else if (e.target.value === '') {
            onChange(min);
        }
    };

    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
            <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-electric-blue">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    className="p-2.5 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-all active:scale-90"
                    aria-label="Decrement"
                >
                    <Minus size={16} />
                </button>
                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    className="w-full text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    className="p-2.5 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-all active:scale-90"
                    aria-label="Increment"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};

export default NumberInput;
