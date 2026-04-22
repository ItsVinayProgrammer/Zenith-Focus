import { useState, useEffect, useMemo } from 'react';
import { THEMES } from '../constants';
import type { Theme } from '../types';

const useTheme = () => {
  const [themeId, setThemeId] = useState(() => {
    try {
      const savedThemeId = localStorage.getItem('themeId');
      return savedThemeId && THEMES.some(t => t.id === savedThemeId) ? savedThemeId : 'zenith';
    } catch {
      return 'zenith';
    }
  });

  const activeTheme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply new theme properties
    for (const [key, value] of Object.entries(activeTheme.colors)) {
        if (key === '--background-style') {
            document.body.style.backgroundImage = value as string;
        } else {
            root.style.setProperty(key, value as string);
        }
    }
    
    try {
      localStorage.setItem('themeId', themeId);
    } catch (error) {
      console.error("Error saving theme to localStorage", error);
    }
  }, [activeTheme, themeId]);
  
  // Listen for theme changes from other tabs/windows to keep them in sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'themeId' && e.newValue) {
        if (THEMES.some(t => t.id === e.newValue)) {
            setThemeId(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { themes: THEMES, activeTheme, setThemeId };
};

export default useTheme;
