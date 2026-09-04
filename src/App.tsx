import { HashRouter, Route, Routes } from 'react-router-dom';

import { HomeScreen } from '@/screens/HomeScreen';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
