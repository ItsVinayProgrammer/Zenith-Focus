
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';

export interface CommandAction {
  id: string;
  name: string;
  shortcut?: string[];
  keywords?: string;
  onExecute: () => void;
  icon?: React.ReactNode;
  group?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
    }
  }, [isOpen]);

  const filteredActions = useMemo(() => actions.filter(action => 
    action.name.toLowerCase().includes(search.toLowerCase()) || 
    action.keywords?.toLowerCase().includes(search.toLowerCase())
  ), [actions, search]);
  
  useEffect(() => {
      setSelectedIndex(0);
  }, [filteredActions]);

  useEffect(() => {
    if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleActionClick = (action: CommandAction) => {
    action.onExecute();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || filteredActions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = filteredActions[selectedIndex];
        if (action) {
          handleActionClick(action);
        }
      } else if (e.key === 'Escape') {
          onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  const groupedActions = useMemo(() => {
      const groups: Record<string, CommandAction[]> = {};
      const groupOrder = ['Timer', 'Tasks', 'Navigation', 'General'];

      for (const groupName of groupOrder) {
          groups[groupName] = [];
      }

      for (const action of filteredActions) {
          const groupName = action.group || 'General';
          if (!groups[groupName]) {
              groups[groupName] = [];
          }
          groups[groupName].push(action);
      }
      return groups;
  }, [filteredActions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="w-full max-w-lg bg-dark-card border border-white/10 rounded-lg shadow-2xl animate-dropdown-enter" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search className="w-5 h-5 text-gray-400"/>
            <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
        </div>
        <ul className="p-2 max-h-[60vh] overflow-y-auto">
            {filteredActions.length > 0 ? (
              Object.keys(groupedActions).map(groupName => {
                const groupActions = groupedActions[groupName];
                if (groupActions.length === 0) {
                  return null;
                }
                return (
                  <React.Fragment key={groupName}>
                    <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none">
                      {groupName}
                    </li>
                    {groupActions.map(action => {
                        const index = filteredActions.findIndex(a => a.id === action.id);
                        return (
                          <li
                              ref={selectedIndex === index ? activeItemRef : null}
                              key={action.id}
                              onClick={() => handleActionClick(action)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`flex justify-between items-center p-3 rounded-md cursor-pointer ${selectedIndex === index ? 'bg-electric-blue text-white' : 'text-gray-300 hover:bg-white/10'}`}
                          >
                              <div className="flex items-center gap-3">
                                  {action.icon}
                                  <span>{action.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  {action.shortcut?.map(key => (
                                      <kbd key={key} className="px-2 py-1 text-xs font-sans text-gray-400 bg-black/20 border border-white/10 rounded-md">{key}</kbd>
                                  ))}
                              </div>
                          </li>
                        );
                    })}
                  </React.Fragment>
                )
              })
            ) : (
                <li className="p-4 text-center text-gray-500">No results found.</li>
            )}
        </ul>
      </div>
    </div>
  );
};