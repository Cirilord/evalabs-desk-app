import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';

import { AppLayout } from '@/components/shared/AppLayout';
import { TelemetryProvider } from '@/components/shared/TelemetryProvider';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { trackEvent, trackPageView } from '@/lib/analytics';
import { AutomationRunsScreen } from '@/screens/AutomationRunsScreen';
import { CreateAutomationScreen } from '@/screens/CreateAutomationScreen';
import { EditAutomationScreen } from '@/screens/EditAutomationScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

const queryClient = new QueryClient();
const ONBOARDING_COMPLETED_KEY = 'eva-labs-onboarding-completed';

function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

function AppContent() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(
    () => window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
  );

  function completeOnboarding() {
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    trackEvent('onboarding_completed');
    setIsOnboardingComplete(true);
  }

  if (!isOnboardingComplete) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <TooltipProvider>
      <HashRouter>
        <RouteAnalytics />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/automations/new" element={<CreateAutomationScreen />} />
            <Route path="/automations/:automationId/edit" element={<EditAutomationScreen />} />
            <Route path="/automations/:automationId" element={<AutomationRunsScreen />} />
          </Route>
        </Routes>
      </HashRouter>
    </TooltipProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TelemetryProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </TelemetryProvider>
    </ThemeProvider>
  );
}

export default App;
