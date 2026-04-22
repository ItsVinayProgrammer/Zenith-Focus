import { useState, useEffect } from 'react';
import type { UserProfile } from '../types';

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('userProfile');
      return saved ? JSON.parse(saved) : { name: 'Zenith User' };
    } catch {
      return { name: 'Zenith User' };
    }
  });

  useEffect(() => {
    safeSetItem('userProfile', JSON.stringify(profile));
  }, [profile]);
  
  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile' && e.newValue) {
        try {
          const newProfile = JSON.parse(e.newValue);
          if (typeof newProfile === 'object' && newProfile !== null && 'name' in newProfile) {
            setProfile(newProfile);
          }
        } catch (error) {
            console.error('Error parsing userProfile from storage', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  return { profile, updateProfile };
};

export default useUserProfile;
