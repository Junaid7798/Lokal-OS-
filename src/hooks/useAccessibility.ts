import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !(event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    { key: 'h', action: () => navigate('/'), description: 'Go to Home' },
    {
      key: 'c',
      action: () => navigate('/customers'),
      description: 'Go to Customers',
    },
    {
      key: 'a',
      action: () => navigate('/appointments'),
      description: 'Go to Appointments',
    },
    {
      key: 'r',
      action: () => navigate('/revenue'),
      description: 'Go to Revenue',
    },
    {
      key: 's',
      action: () => navigate('/settings'),
      description: 'Go to Settings',
    },
    {
      key: '?',
      shift: true,
      action: () =>
        alert(
          'Keyboard Shortcuts:\n\nh - Home\nc - Customers\n-a - Appointments\nr - Revenue\ns - Settings\n? - Show this help'
        ),
      description: 'Show keyboard shortcuts',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = document.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
}

export function useAnnounce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [message, priority]);
}

export function useSkipLink(
  targetId: string,
  message: string = 'Skip to main content'
) {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded';
  link.textContent = message;
  return link;
}

export function trapFocus(containerRef: React.RefObject<HTMLElement>) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    },
    [containerRef]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);
}

export const A11Y_LABELS = {
  close: 'Close',
  menu: 'Open menu',
  search: 'Search',
  filter: 'Filter options',
  sort: 'Sort options',
  add: 'Add new',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save changes',
  cancel: 'Cancel',
  back: 'Go back',
  next: 'Next',
  previous: 'Previous',
  loading: 'Loading, please wait',
  success: 'Success',
  error: 'Error occurred',
} as const;

export type A11yLabel = keyof typeof A11Y_LABELS;

export function getA11yLabel(key: A11yLabel): string {
  return A11Y_LABELS[key];
}
