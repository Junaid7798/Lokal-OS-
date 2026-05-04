/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { initSentry } from './lib/sentry';
import { initAnalytics, trackPageView } from './lib/analytics';
import { OnboardingTour } from './components/OnboardingTour';
import { AccessibilityAudit } from './components/AccessibilityAudit';
import Layout from './components/Layout';
import Auth from './views/Auth';
import Home from './views/Home';
import Customers from './views/Customers';
import Settings from './views/Settings';
import SetupSupabase from './views/SetupSupabase';
import { Skeleton } from './components/ui/skeleton';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const CustomerDetail = lazy(() => import('./views/CustomerDetail'));
const Reviews = lazy(() => import('./views/Reviews'));
const DataManagement = lazy(() => import('./views/DataManagement'));
const Leads = lazy(() => import('./views/Leads'));
const Appointments = lazy(() => import('./views/Appointments'));
const Campaigns = lazy(() => import('./views/Campaigns'));
const LoyaltySettings = lazy(() => import('./views/LoyaltySettings'));
const FollowUps = lazy(() => import('./views/FollowUps'));
const Inactive = lazy(() => import('./views/Inactive'));
const GoogleReviewKit = lazy(() => import('./views/GoogleReviewKit'));
const Upgrade = lazy(() => import('./views/Upgrade'));
const ReviewMonitoring = lazy(() => import('./views/ReviewMonitoring'));
const AgencyDashboard = lazy(() => import('./views/AgencyDashboard'));
const Locations = lazy(() => import('./views/Locations'));
const ActivityLog = lazy(() => import('./views/ActivityLog'));
const RevenueDashboard = lazy(() => import('./views/RevenueDashboard'));
const Reports = lazy(() => import('./views/Reports'));
const Automation = lazy(() => import('./views/Automation'));
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import * as Sentry from '@sentry/react';

function initializeServices() {
  initSentry();
  initAnalytics();
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  return null;
}

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    initializeServices();
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" enableSystem attribute="class">
      <Sentry.ErrorBoundary
        fallback={
          <div className="p-4 text-center">
            Something went wrong. Please refresh the page.
          </div>
        }
      >
        <ErrorBoundary>
          <BrowserRouter>
            <PageTracker />
            <OnboardingTour />
            <AccessibilityAudit />
            <Routes>
              {!user ? (
                <Route
                  path="*"
                  element={<Auth />}
                />
              ) : (
                <Route element={<Layout />}>
                  <Route path="/setup" element={<SetupSupabase />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/data" element={<DataManagement />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/loyalty" element={<LoyaltySettings />} />
                  <Route
                    path="/revenue"
                    element={
                      <Suspense
                        fallback={
                          <div className="p-8 space-y-4">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                          </div>
                        }
                      >
                        <RevenueDashboard />
                      </Suspense>
                    }
                  />
                  <Route path="/review-kit" element={<GoogleReviewKit />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route
                    path="/automation"
                    element={
                      <Suspense
                        fallback={
                          <div className="p-8 space-y-4">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                          </div>
                        }
                      >
                        <Automation />
                      </Suspense>
                    }
                  />
                  <Route path="/review-monitoring" element={<ReviewMonitoring />} />
                  <Route path="/agency-dashboard" element={<AgencyDashboard />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/activity" element={<ActivityLog />} />
                  <Route path="/follow-ups" element={<FollowUps />} />
                  <Route path="/inactive" element={<Inactive />} />
                  <Route
                    path="/reports"
                    element={
                      <Suspense
                        fallback={
                          <div className="p-8 space-y-4">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                          </div>
                        }
                      >
                        <Reports />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Settings onLogout={signOut} />
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              )}
            </Routes>
          </BrowserRouter>
          <Toaster />
        </ErrorBoundary>
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}