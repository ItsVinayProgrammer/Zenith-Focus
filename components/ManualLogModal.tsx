import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from './ui/Modal';
import CustomSelect from './ui/CustomSelect';
import type { SessionLog, Category } from '../types';
import { SessionType } from '../types';
import { Briefcase, Coffee, BrainCircuit, X, AlertTriangle } from 'lucide-react';
import { ICONS } from '../constants';
import NumberInput from './ui/NumberInput';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  addLog: (log: Omit<SessionLog, 'id'>) => void;
  categories: Category[];
}

const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, addLog, categories }) => {
  const [type, setType] = useState<SessionType>(SessionType.Work);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const resetState = useCallback(() => {
    setType(SessionType.Work);
    setDate(new Date().toISOString().split('T')[0]);
    setDurationMinutes(25);
    setSelectedCategory(categories[0]?.name || '');
    setError(null);
    setNotes('');
  }, [categories]);

  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow closing animation to finish
      setTimeout(resetState, 300);
    } else {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0].name);
        }
    }
  }, [isOpen, resetState, categories, selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (durationMinutes <= 0) {
        setError('Duration must be a positive number.');
        return;
    }
    
    const durationInSeconds = durationMinutes * 60;

    const now = new Date();
    const endDateTime = new Date(date);
    endDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    // If user selects a future date, set the time to the end of that day.
    if (endDateTime > now) {
        endDateTime.setHours(23, 59, 59);
    }

    const startDateTime = new Date(endDateTime.getTime() - durationInSeconds * 1000);
    
    if (type === SessionType.Work && !selectedCategory) {
        setError('Please select a category for the focus session.');
        return;
    }

    addLog({
      type,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: durationInSeconds,
      category: type === SessionType.Work ? selectedCategory : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    });
    
    onClose();
  };

  const typeOptions = [
    { value: SessionType.Work, label: 'Focus Session', icon: <Briefcase size={16} className="text-accent-cyan" /> },
    { value: SessionType.ShortBreak, label: 'Short Break', icon: <Coffee size={16} className="text-green-400" /> },
    { value: SessionType.LongBreak, label: 'Long Break', icon: <BrainCircuit size={16} className="text-yellow-400" /> },
  ];
  
  const categoryOptions = useMemo(() =>
    categories.map(cat => ({
        value: cat.name,
        label: cat.name,
        icon: <span style={{ color: cat.color }}>{ICONS[cat.icon] || ICONS['Tag']}</span>,
    }))
  , [categories]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Log Entry">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-gray-300">
        <div>
          <label htmlFor="log-type" className="block text-sm font-medium mb-1">Session Type</label>
          <CustomSelect
            value={type}
            onChange={(value) => setType(value as SessionType)}
            options={typeOptions}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="log-date" className="block text-sm font-medium mb-1">Date</label>
            <input
              id="log-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-black/20 p-2 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>
          <NumberInput 
            label="Duration (minutes)"
            value={durationMinutes}
            onChange={setDurationMinutes}
            min={1}
            max={180}
          />
        </div>
        
        {type === SessionType.Work && (
          <>
            <div>
              <label htmlFor="log-category" className="block text-sm font-medium mb-1">Category</label>
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
                placeholder="Select a category"
              />
            </div>
            <div>
                <label htmlFor="log-notes" className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea 
                  id="log-notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you accomplish during this session?" 
                  rows={3}
                  className="w-full bg-black/20 p-2 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
            </div>
          </>
        )}

        {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm">
                <AlertTriangle size={16} />
                <span>{error}</span>
            </div>
        )}

        <div className="flex justify-end gap-4 pt-4 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all active:scale-95">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 rounded-lg bg-electric-blue hover:bg-opacity-80 text-white font-semibold transition-all active:scale-95">
            Save Log
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualLogModal;