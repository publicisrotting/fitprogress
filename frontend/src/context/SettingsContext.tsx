import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ApiError, apiJson } from '../config';
import { translations } from '../translations';

type Language = 'en' | 'ru' | 'uk';
type Theme = 'light' | 'dark';
type UnitSystem = 'metric' | 'imperial';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  units: UnitSystem;
  setUnits: (units: UnitSystem) => void;
  t: (key: string) => any;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved && saved !== 'undefined' && saved !== 'null') ? (saved as Language) : 'uk';
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    const initial = (saved && saved !== 'undefined' && saved !== 'null') ? (saved as Theme) : 'dark';
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return initial;
  });
  const [units, setUnitsState] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('units');
    return (saved && saved !== 'undefined' && saved !== 'null') ? (saved as UnitSystem) : 'metric';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('units', units);
  }, [units]);

  // Sync settings with backend
  useEffect(() => {
    if (token) {
      apiJson<{ language?: Language; theme?: Theme; units?: UnitSystem }>('/api/user/settings', { token })
        .then((data) => {
          if (!data) return;
          if (data.language) setLanguageState(data.language);
          if (data.theme) setThemeState(data.theme);
          if (data.units) setUnitsState(data.units);
        })
        .catch((err) => {
          if (err instanceof ApiError && (err.status === 401 || err.status === 404)) logout();
        });
    }
  }, [token, logout]);

  // Save settings to backend
  useEffect(() => {
    if (token) {
      apiJson('/api/user/settings', {
        method: 'PUT',
        token,
        body: { language, theme, units }
      }).catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
    }
  }, [language, theme, units, token, logout]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleTheme = () => setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  const setUnits = (u: UnitSystem) => setUnitsState(u);

  const t = (key: string) => {
    try {
      const keys = key.split('.');
      // Safely access translation object, fallback to 'uk' -> 'en' -> empty
      let value: any = translations[language];
      
      if (!value) value = translations['uk'];
      if (!value) value = translations['en'];
      if (!value) return key;
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          return key;
        }
      }
      
      // Ensure we return a renderable value (string or number)
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      
      // If result is object/null/undefined, return key to avoid React render errors
      return key;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, toggleTheme, units, setUnits, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
