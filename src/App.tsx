import { HashRouter, Route, Routes } from 'react-router-dom';

import { TooltipProvider } from '@/components/ui/tooltip';
import { HomeScreen } from '@/screens/HomeScreen';

function App() {
  return (
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  );
}

export default App;
