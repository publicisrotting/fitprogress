import { Home, Dumbbell, Brain, BarChart3, User } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface BottomNavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const { t } = useSettings();

  const navItems = [
    { id: 'dashboard',  label: t('navigation.home'),             icon: Home },
    { id: 'diary',      label: t('navigation.diary') || 'Diary', icon: Dumbbell },
    { id: 'coach',      label: t('navigation.coach') || 'Coach', icon: Brain },
    { id: 'statistics', label: t('navigation.statistics'),       icon: BarChart3 },
    { id: 'profile',    label: t('navigation.profile'),          icon: User },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000]"
      style={{
        background: 'var(--bg-card)',
        borderTop: '0.5px solid var(--separator)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = currentScreen === item.id ||
            (item.id === 'diary' && currentScreen === 'history');
          const color = active ? 'var(--c-primary)' : 'var(--text-tertiary)';
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex-1 flex flex-col items-center justify-center pt-2.5 pb-1.5 active:opacity-60 transition-opacity"
            >
              {/* Fixed 24px icon box so every icon sits on the same baseline */}
              <span className="h-6 w-6 flex items-center justify-center">
                <item.icon
                  className="w-[22px] h-[22px]"
                  style={{ color }}
                  strokeWidth={active ? 2.4 : 2}
                />
              </span>
              <span
                className="mt-1 text-[10px] font-semibold leading-none w-full text-center truncate px-0.5"
                style={{ color }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
