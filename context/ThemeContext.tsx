'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Tema = 'light' | 'dark' | 'system';

interface ThemeContextType {
  tema: Tema;
  setTema: (t: Tema) => void;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {

  const [tema, setTemaState] = useState<Tema>('system');

  // Aplica el tema al HTML
  const aplicarTema = (t: Tema) => {
    const root = document.documentElement;

    if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', t);
    }
  };

  const setTema = (nuevo: Tema) => {
    setTemaState(nuevo);
    aplicarTema(nuevo);
    localStorage.setItem('tema-app', nuevo);
  };

  const alternarTema = () => {
    if (tema === 'light') setTema('dark');
    else setTema('light');
  };

  useEffect(() => {
    const guardado = localStorage.getItem('tema-app') as Tema | null;
    setTema(guardado || 'system');
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, setTema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeApp() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeApp debe usarse dentro de ThemeProvider');
  return ctx;
}
