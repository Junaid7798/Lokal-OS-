import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const isDev = import.meta.env.MODE === 'development';

interface AccessibilityResult {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
}

interface AxeViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | string;
  description: string;
  help: string;
}

export function AccessibilityAudit() {
  const [results, setResults] = useState<AccessibilityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isDev || !isOpen) return;

    const checkAccessibility = async () => {
      try {
        const axe = await import('axe-core');
        const results = await axe.run(document);
        const violations = (results.violations as AxeViolation[]).map((v) => ({
          id: v.id,
          impact: v.impact as AccessibilityResult['impact'],
          description: v.description,
          help: v.help,
        }));
        setResults(violations);
      } catch (err) {
        console.error('Accessibility audit failed:', err);
      }
    };

    checkAccessibility();
  }, [isOpen]);

  if (!isDev) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100"
        onClick={() => setIsOpen(!isOpen)}
        title="Run accessibility audit"
      >
        A11y
      </Button>

      {isOpen && results.length > 0 && (
        <div className="fixed bottom-12 right-4 z-50 w-96 max-h-96 overflow-auto bg-background border rounded-lg shadow-lg p-4">
          <h3 className="font-bold mb-2">
            Accessibility Results ({results.length})
          </h3>
          {results.map((result, i) => (
            <div
              key={i}
              className={`text-sm p-2 mb-2 rounded ${
                result.impact === 'critical'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : result.impact === 'serious'
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : result.impact === 'moderate'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <span className="font-semibold capitalize">
                [{result.impact}]
              </span>
              <p className="mt-1">{result.description}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default AccessibilityAudit;
