import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/shared/AppLayout';
import { OnboardingScreen } from '@/components/shared/OnboardingScreen';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AutomationRunsScreen } from '@/screens/AutomationRunsScreen';
import { CreateAutomationScreen } from '@/screens/CreateAutomationScreen';
import { EditAutomationScreen } from '@/screens/EditAutomationScreen';
import { HomeScreen } from '@/screens/HomeScreen';

const queryClient = new QueryClient();
const ONBOARDING_COMPLETED_KEY = 'eva-labs-onboarding-completed';

function AppContent() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(
    () => window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
  );

  function completeOnboarding() {
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOnboardingComplete(true);
  }

  if (!isOnboardingComplete) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <TooltipProvider>
      <HashRouter>
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
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
