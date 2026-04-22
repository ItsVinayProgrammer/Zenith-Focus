
import { useState, useEffect } from 'react';
import type { TimerSettings } from '../types';
import { validateSettings } from '../utils/settingsValidator';

const useTimerSettings = () => {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    let loadedSettings: Partial<TimerSettings> = {};
    try {
      const saved = localStorage.getItem('timerSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we have an object, not some other JSON value like a string or null
        if (typeof parsed === 'object' && parsed !== null) {
          loadedSettings = parsed;
        }
      }
    } catch (error) {
      console.error("Error loading timer settings from localStorage", error);
      // Fallback to empty object, defaults will be used.
      loadedSettings = {};
    }
    
    return validateSettings(loadedSettings);
  });

  useEffect(() => {
    try {
      localStorage.setItem('timerSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving timer settings to localStorage", error);
    }
  }, [settings]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'timerSettings' && e.newValue) {
        try {
          const parsedSettings = JSON.parse(e.newValue);
          if (typeof parsedSettings === 'object' && parsedSettings !== null) {
            setSettings(validateSettings(parsedSettings));
          }
        } catch (error) {
            console.error('Error parsing timerSettings from storage', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
  };

  return { settings, updateSettings };
};

export default useTimerSettings;
