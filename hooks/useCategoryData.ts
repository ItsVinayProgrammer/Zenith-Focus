
import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const createCategoryId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `cat-${crypto.randomUUID()}`;
    }

    return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const useCategoryData = () => {
    const [categories, setCategories] = useState<Category[]>(() => {
        try {
            const saved = localStorage.getItem('taskCategories');
            if (saved) {
                // Merge saved data with defaults to ensure all default categories are present
                // and to update properties of default categories if they change in constants.tsx
                const savedCategories = JSON.parse(saved) as Category[];
                const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
                const customCategories = savedCategories.filter(c => !c.isDefault || !defaultIds.has(c.id));
                
                // Update existing default categories from constants, in case of app updates
                const updatedDefaults = DEFAULT_CATEGORIES.map(defCat => {
                    const savedVersion = savedCategories.find(s => s.id === defCat.id);
                    return savedVersion || defCat;
                });

                return [...updatedDefaults, ...customCategories];
            }
        } catch (error) {
            console.error('Error loading categories from localStorage', error);
        }
        return DEFAULT_CATEGORIES;
    });

    useEffect(() => {
        try {
            localStorage.setItem('taskCategories', JSON.stringify(categories));
        } catch (error) {
            console.error('Error saving categories to localStorage', error);
        }
    }, [categories]);
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'taskCategories' && e.newValue) {
            try {
              const newCategories = JSON.parse(e.newValue);
              if (Array.isArray(newCategories)) {
                 setCategories(newCategories);
              }
            } catch (error) {
                console.error('Error parsing taskCategories from storage', error);
            }
          }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const addCategory = useCallback((category: Omit<Category, 'id' | 'isDefault'>) => {
        setCategories(prev => [...prev, {
            ...category,
            id: createCategoryId(),
            isDefault: false,
        }]);
    }, []);

    const updateCategory = useCallback((updatedCategory: Category) => {
        setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
    }, []);

    const deleteCategory = useCallback((categoryId: string) => {
        setCategories(prev => {
            const categoryToDelete = prev.find(c => c.id === categoryId);
            if (!categoryToDelete || categoryToDelete.isDefault) {
                console.warn("Attempted to delete a default or non-existent category.");
                return prev;
            }
            return prev.filter(cat => cat.id !== categoryId);
        });
    }, []);
    
    return { categories, addCategory, updateCategory, deleteCategory };
};

export default useCategoryData;
