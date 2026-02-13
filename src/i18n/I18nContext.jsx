import React, { createContext, useContext, useState } from 'react';
import en from './en';
import fr from './fr';

const translations = { en, fr };

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('fight-timer-lang') || 'en');

  const t = (key, vars) => {
    let str = translations[lang]?.[key] || en[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('fight-timer-lang', l);
  };

  return (
    <I18nContext.Provider value={{ t, lang, changeLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);
