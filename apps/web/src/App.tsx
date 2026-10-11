import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing.js';
import { EnterPage } from './pages/EnterPage.js';
import { CaseRoom } from './pages/CaseRoom.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';
import { AdminDashboard } from './pages/AdminDashboard.js';

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/enter" element={<EnterPage />} />
      <Route path="/case" element={<CaseRoom />} />
      {/* legacy paths from the first build */}
      <Route path="/login" element={<Navigate to="/enter" replace />} />
      <Route path="/hq" element={<AdminLoginPage />} />
      <Route path="/hq/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
