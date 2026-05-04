import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PrefetchRules {
  [currentPath: string]: string[];
}

const PREFETCH_RULES: PrefetchRules = {
  '/': ['/customers', '/appointments', '/reports'],
  '/home': ['/customers', '/appointments', '/reports'],
  '/customers': ['/customer', '/appointments', '/leads'],
  '/customer': ['/customers', '/appointments'],
  '/appointments': ['/customers', '/home'],
  '/leads': ['/customers', '/campaigns'],
  '/campaigns': ['/leads', '/automation'],
  '/automation': ['/campaigns', '/home'],
  '/reports': ['/revenue', '/home'],
  '/revenue': ['/reports', '/home'],
  '/inactive': ['/customers', '/follow-ups'],
  '/follow-ups': ['/customers', '/inactive'],
  '/settings': ['/customers', '/home'],
};

export function usePrefetch() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetch = (path: string) => {
    if (prefetchedRef.current.has(path)) return;
    prefetchedRef.current.add(path);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'script';
    document.head.appendChild(link);
  };

  useEffect(() => {
    const routesToPrefetch = PREFETCH_RULES[location.pathname] || [];
    routesToPrefetch.forEach(prefetch);
  }, [location.pathname]);

  return { prefetch };
}

export function RoutePrefetcher() {
  usePrefetch();
  return null;
}

export function LinkWithPrefetch({
  to,
  children,
  onClick,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  const navigate = useNavigate();
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    onClick?.();
  };

  const handleMouseEnter = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = to;
    link.as = 'script';
    document.head.appendChild(link);
  };

  return (
    <a
      ref={linkRef}
      href={to}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </a>
  );
}

export function PrefetchLink({
  to,
  children,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = to;
      link.as = 'script';
      document.head.appendChild(link);
    }
  };

  return (
    <a href={to} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </a>
  );
}
