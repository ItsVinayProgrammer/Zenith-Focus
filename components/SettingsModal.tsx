import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import type { Theme, Category, TimerSettings } from '../types';
import { INITIAL_TIMER_SETTINGS } from '../constants';
import { SOUND_OPTIONS, ICONS } from '../constants';
import CustomSelect from './ui/CustomSelect';
import { Play, Check, Edit, Trash2, X, Plus, Clock, Volume2, Tag, Palette, AlertTriangle, ChevronDown } from 'lucide-react';
import NumberInput from './ui/NumberInput';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: TimerSettings;
  onSave: (newSettings: TimerSettings) => void;
  themes: Theme[];
  activeTheme: Theme;
  setTheme: (themeId: string) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-electric-blue focus:ring-offset-2 focus:ring-offset-dark-card active:scale-95 ${
      enabled ? 'bg-electric-blue' : 'bg-gray-600'
    }`}
  >
    <span
      aria-hidden="true"
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  themes,
  activeTheme,
  setTheme,
  categories,
  addCategory,
  updateCategory,
  deleteCategory
}) => {
  const [settings, setSettings] = useState(currentSettings);
  const [activeTab, setActiveTab] = useState('timer');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6', icon: 'Tag' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
      setActiveTab('timer');
      setEditingCategory(null);
      setIsAddingCategory(false);
      setCategoryError('');
    }
  }, [isOpen, currentSettings]);
  
  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(INITIAL_TIMER_SETTINGS);
  };
  
  const handlePlaySound = () => {
    if (settings.soundUrl) {
      const audio = new Audio(settings.soundUrl);
      audio.play().catch(e => console.error("Sound test failed:", e));
    }
  };
  
  const handleEditCategory = (category: Category) => {
      setCategoryError('');
      setEditingCategory({ ...category });
      setIsAddingCategory(false);
  };

  const handleUpdateCategory = () => {
      if (!editingCategory) return;
      if (editingCategory.name.trim().length === 0) {
          setCategoryError('Category name cannot be empty.');
          return;
      }
      if (categories.some(c => c.name.toLowerCase() === editingCategory.name.toLowerCase() && c.id !== editingCategory.id)) {
          setCategoryError('A category with this name already exists.');
          return;
      }
      updateCategory(editingCategory);
      setEditingCategory(null);
      setCategoryError('');
  };

  const handleAddNewCategory = () => {
    if (newCategory.name.trim().length === 0) {
        setCategoryError('Category name cannot be empty.');
        return;
    }
    if (categories.some(c => c.name.toLowerCase() === newCategory.name.toLowerCase())) {
        setCategoryError('A category with this name already exists.');
        return;
    }
    addCategory(newCategory);
    setNewCategory({ name: '', color: '#3B82F6', icon: 'Tag' });
    setIsAddingCategory(false);
    setCategoryError('');
  };

  const tabs = [
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'sound', label: 'Sound', icon: Volume2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'categories', label: 'Categories', icon: Tag },
  ];
  
  const soundOptions = SOUND_OPTIONS.map(s => ({ value: s.url, label: s.name }));
  
  const CategoryForm: React.FC<{
    category: Category | typeof newCategory;
    setCategory: (cat: any) => void;
    onSave: () => void;
    onCancel: () => void;
    isNew?: boolean;
  }> = ({ category, setCategory, onSave, onCancel, isNew = false }) => {
      const [isPickerOpen, setIsPickerOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const pickerRef = useRef<HTMLDivElement>(null);
      const buttonRef = useRef<HTMLButtonElement>(null);

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        };
        if (isPickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [isPickerOpen]);

      const filteredIconKeys = Object.keys(ICONS).filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()));

      return (
        <div className="bg-black/20 p-4 rounded-lg space-y-3 animate-dropdown-enter">
          <input
            type="text"
            placeholder="Category Name"
            value={category.name}
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
            className="w-full bg-dark-card p-2 rounded-md border border-white/10 focus:outline-none focus:ring-1 focus:ring-electric-blue"
          />
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <label htmlFor="color-picker" className="text-sm">Color:</label>
                <input
                  id="color-picker"
                  type="color"
                  value={category.color}
                  onChange={(e) => setCategory({ ...category, color: e.target.value })}
                  className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer"
                />
             </div>

             <div className="flex items-center gap-2">
                <label className="text-sm">Icon:</label>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() => setIsPickerOpen(prev => !prev)}
                        className="flex items-center gap-2 p-2 rounded-md bg-dark-card hover:bg-white/10 border border-white/10"
                    >
                        {React.cloneElement(ICONS[category.icon] as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                        <span className="text-sm">{category.icon}</span>
                        <ChevronDown size={16} className={`transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPickerOpen && (
                        <div ref={pickerRef} className="absolute z-20 mt-2 w-72 bg-dark-bg border border-white/20 rounded-lg shadow-2xl p-2 flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Search for an icon..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-black/20 p-2 rounded-md border border-white/10"
                                autoFocus
                            />
                            <div className="max-h-48 overflow-y-auto grid grid-cols-6 gap-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
                                {filteredIconKeys.map(iconKey => (
                                    <button
                                        key={iconKey}
                                        type="button"
                                        onClick={() => {
                                            setCategory({ ...category, icon: iconKey });
                                            setIsPickerOpen(false);
                                        }}
                                        title={iconKey}
                                        className={`p-2 rounded-md transition-all ${category.icon === iconKey ? 'bg-electric-blue text-white' : 'hover:bg-white/10'}`}
                                    >
                                        {React.cloneElement(ICONS[iconKey] as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 mx-auto' })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="p-2 text-gray-300 hover:text-white rounded-md active:scale-95"><X size={20} /></button>
            <button type="button" onClick={onSave} className="p-2 text-green-400 hover:text-white rounded-md active:scale-95"><Check size={20} /></button>
          </div>
        </div>
      );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <ul className="space-y-1">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 active:scale-95 ${
                    activeTab === tab.id
                      ? 'bg-electric-blue text-white'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'timer' && (
            <div className="space-y-4">
              <NumberInput label="Focus (minutes)" value={settings.work} onChange={val => setSettings({...settings, work: val})} />
              <NumberInput label="Short Break (minutes)" value={settings.shortBreak} onChange={val => setSettings({...settings, shortBreak: val})} />
              <NumberInput label="Long Break (minutes)" value={settings.longBreak} onChange={val => setSettings({...settings, longBreak: val})} />
              <NumberInput label="Sessions per Long Break" value={settings.pomodorosPerLongBreak} onChange={val => setSettings({...settings, pomodorosPerLongBreak: val})} />
            </div>
          )}
          
          {activeTab === 'sound' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium text-gray-300">Enable Sound</label>
                <ToggleSwitch enabled={settings.enableSound} onChange={val => setSettings({...settings, enableSound: val})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Alarm Sound</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomSelect options={soundOptions} value={settings.soundUrl} onChange={val => setSettings({...settings, soundUrl: val})} />
                  </div>
                  <button onClick={handlePlaySound} className="p-2.5 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 transition-all"><Play size={16} /></button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
               <h3 className="font-semibold text-white">Themes</h3>
               <div className="grid grid-cols-2 gap-4">
                    {themes.map(theme => (
                        <button key={theme.id} onClick={() => setTheme(theme.id)} className={`p-4 rounded-lg border-2 transition-all ${activeTheme.id === theme.id ? 'border-electric-blue' : 'border-transparent hover:border-white/20'}`}>
                            <span className="font-semibold">{theme.name}</span>
                            <div className="flex gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--color-dark-bg'] }}></div>
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--color-accent-indigo'] }}></div>
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--color-accent-cyan'] }}></div>
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors['--color-electric-blue'] }}></div>
                            </div>
                        </button>
                    ))}
               </div>
            </div>
          )}
          
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.id}>
                    {editingCategory?.id === cat.id ? (
                      <CategoryForm 
                        category={editingCategory} 
                        setCategory={setEditingCategory}
                        onSave={handleUpdateCategory}
                        onCancel={() => { setEditingCategory(null); setCategoryError(''); }}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span style={{ color: cat.color }}>{ICONS[cat.icon] || ICONS['Tag']}</span>
                          <span className="font-medium text-white">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {!cat.isDefault && (
                                <>
                                    <button onClick={() => handleEditCategory(cat)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-md active:scale-95"><Edit size={16} /></button>
                                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-md active:scale-95"><Trash2 size={16} /></button>
                                </>
                            )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {isAddingCategory ? (
                  <CategoryForm
                    category={newCategory}
                    setCategory={setNewCategory}
                    onSave={handleAddNewCategory}
                    onCancel={() => { setIsAddingCategory(false); setCategoryError(''); }}
                    isNew
                  />
              ) : (
                <button onClick={() => setIsAddingCategory(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white font-semibold text-sm active:scale-95">
                    <Plus size={16} /> Add New Category
                </button>
              )}
               {categoryError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm">
                      <AlertTriangle size={16} />
                      <span>{categoryError}</span>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <footer className="flex justify-between items-center pt-6 mt-4 border-t border-white/10">
        <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all active:scale-95">Reset to Defaults</button>
        <div className="flex gap-4">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all active:scale-95 font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-electric-blue hover:bg-opacity-80 text-white font-semibold transition-all active:scale-95">
            Save Changes
          </button>
        </div>
      </footer>
    </Modal>
  );
};
