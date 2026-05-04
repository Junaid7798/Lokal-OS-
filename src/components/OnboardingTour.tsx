import { useState } from 'react';
import { Joyride } from 'react-joyride';

interface OnboardingStep {
  target: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: OnboardingStep[] = [
  {
    target: '[data-tour="customers"]',
    content:
      'View and manage your customer database. Add, edit, or search customers.',
  },
  {
    target: '[data-tour="appointments"]',
    content: 'Schedule and manage customer appointments.',
  },
  {
    target: '[data-tour="campaigns"]',
    content: 'Create WhatsApp campaigns to re-engage customers.',
  },
  {
    target: '[data-tour="analytics"]',
    content: 'Track revenue, customer trends, and business performance.',
  },
  {
    target: '[data-tour="settings"]',
    content: 'Configure your business profile, themes, and message templates.',
  },
];

export function OnboardingTour() {
  const [run, setRun] = useState(() => {
    const hasSeenTour = localStorage.getItem('lokalos_has_seen_tour');
    return !hasSeenTour;
  });

  const handleRestart = () => {
    localStorage.removeItem('lokalos_has_seen_tour');
    setRun(true);
  };

  return (
    <>
      <Joyride
        steps={STEPS.map((step, index) => ({
          ...step,
          title: `Step ${index + 1}`,
        }))}
        run={run}
        continuous
        styles={{
          primaryColor: 'var(--primary)',
          zIndex: 10000,
        } as Record<string, unknown>}
      />
      {typeof window !== 'undefined' && (
        <button
          onClick={handleRestart}
          className="fixed bottom-4 left-4 text-xs text-muted-foreground hover:text-foreground z-50"
          title="Restart onboarding tour"
        >
          ?
        </button>
      )}
    </>
  );
}

export default OnboardingTour;
