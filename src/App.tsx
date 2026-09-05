import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/shared/AppLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AutomationRunsScreen } from '@/screens/AutomationRunsScreen';
import { CreateAutomationScreen } from '@/screens/CreateAutomationScreen';
import { EditAutomationScreen } from '@/screens/EditAutomationScreen';
import { HomeScreen } from '@/screens/HomeScreen';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
