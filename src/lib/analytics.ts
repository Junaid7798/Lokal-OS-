declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    console.warn(
      'Google Analytics not configured - set VITE_GA_MEASUREMENT_ID in .env'
    );
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    debug_mode: import.meta.env.MODE !== 'production',
  });
}

export function trackPageView(pagePath: string, pageTitle?: string) {
  if (!window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (!window.gtag) return;
  window.gtag('event', eventName, params);
}

export function trackUserAction(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  trackEvent('user_interaction', {
    event_category: category,
    event_label: label,
    value,
    action,
  });
}

export function trackError(error: string, fatal = false) {
  trackEvent('exception', {
    description: error,
    fatal,
  });
}
