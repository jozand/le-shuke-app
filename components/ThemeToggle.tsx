'use client';

import { useThemeApp } from '@/context/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { tema, setTema } = useThemeApp();

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setTema('light')}>
        <Sun size={18} className={tema === 'light' ? 'text-yellow-400' : 'text-slate-300'} />
      </button>
      <button onClick={() => setTema('dark')}>
        <Moon size={18} className={tema === 'dark' ? 'text-blue-400' : 'text-slate-300'} />
      </button>
      {/*<button onClick={() => setTema('system')}>
        <Monitor size={18} className={tema === 'system' ? 'text-green-400' : 'text-slate-300'} />
      </button>*/}
    </div>
  );
}
