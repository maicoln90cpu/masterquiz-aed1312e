import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
        const matchesModifier = ctrlOrMeta
          ? (event.ctrlKey || event.metaKey)
          : !event.ctrlKey && !event.metaKey;
        
        const matchesShift = shortcut.shiftKey
          ? event.shiftKey
          : !event.shiftKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          matchesModifier &&
          matchesShift
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Atalhos globais padrão
export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => navigate('/create-quiz'),
      description: 'Criar novo quiz',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]');
        searchInput?.focus();
      },
      description: 'Focar na busca',
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]');
        searchInput?.focus();
      },
      description: 'Focar na busca',
    },
  ];

  useKeyboardShortcuts(shortcuts);
};
