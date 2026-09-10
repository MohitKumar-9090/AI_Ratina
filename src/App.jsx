import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import OfflineIndicator from './components/OfflineIndicator';

import DashboardPage from './pages/DashboardPage';
import ImageUploadPage from './pages/ImageUploadPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultPage from './pages/ResultPage';
import PatientsPage from './pages/PatientsPage';
import PatientProfilePage from './pages/PatientProfilePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <OfflineIndicator />
        <Navbar />
        <Routes>
          {/* Direct launch on Dashboard - No login */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/screening" element={<ImageUploadPage />} />
          <Route path="/screening/upload" element={<ImageUploadPage />} />
          <Route path="/screening/processing" element={<ProcessingPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientProfilePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/records" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
