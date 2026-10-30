'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import en from '../../locales/en.json';
import hi from '../../locales/hi.json';

type Language = 'en' | 'hi';

const translations = {
  en,
  hi
};

interface TranslationContextType {
  t: (key: string) => string;
  lang: Language;
  setLang: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLang = localStorage.getItem('rozgarmatrix_lang');
        if (savedLang === 'en' || savedLang === 'hi') {
          setLang(savedLang as Language);
        }
      } catch (e) {
        console.warn('Storage access denied: defaulting to English');
      }
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rozgarmatrix_lang', newLang);
      } catch (e) {
        console.warn('Storage write failed');
      }
    }
  };

  const t = (key: string): string => {
    const dictionary = (translations[lang] || translations['en']) as Record<string, string>;
    const value = dictionary[key];
    
    if (value) return value;

    if (lang !== 'en') {
      const enDict = translations['en'] as Record<string, string>;
      if (enDict[key]) return enDict[key];
    }

    return key;
  };

  return (
    <TranslationContext.Provider value={{ t, lang, setLang: handleSetLang }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}