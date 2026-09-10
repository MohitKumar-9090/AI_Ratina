import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from '../data/translations.json';
import {
  fetchPatients,
  fetchReports,
  fetchScreenings,
  createPatient as apiCreatePatient,
  createScreening as apiCreateScreening,
  createReport as apiCreateReport,
  checkBackendHealth
} from '../services/api';
import { getErrorMessage } from '../utils/errorUtils';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  THEME: 'retina_ai_theme',
  LANG: 'retina_ai_language',
  PATIENTS: 'retina_ai_patients',
  SCREENINGS: 'retina_ai_screenings',
  REPORTS: 'retina_ai_reports'
};

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  });

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LANG) || 'en';
  });

  const [backendOnline, setBackendOnline] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Primary platform collections (Patients, Screenings, Reports)
  const [patients, setPatients] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [reports, setReports] = useState([]);

  // Active workflow state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [latestResult, setLatestResult] = useState(null);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Initial load from API / Local
  useEffect(() => {
    checkBackendHealth().then(health => setBackendOnline(Boolean(health)));
    fetchPatients().then(setPatients).catch(err => showToast(getErrorMessage(err), 'error'));
    fetchReports().then(setReports).catch(() => {});
    fetchScreenings().then(setScreenings).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => {
      const next = prev === 'en' ? 'hi' : 'en';
      localStorage.setItem(STORAGE_KEYS.LANG, next);
      return next;
    });
  }, []);

  const t = useCallback((key, fallback) => {
    const keys = key.split('.');
    let val = translations[language];
    for (const k of keys) {
      if (val && val[k] !== undefined) {
        val = val[k];
      } else {
        return fallback !== undefined ? fallback : key;
      }
    }
    return val;
  }, [language]);

  const showToast = useCallback((message, type = 'default') => {
    // Ensuring message is always a string to prevent [object Object] rendering
    setToastMessage(getErrorMessage(message));
    setTimeout(() => setToastMessage(''), 3200);
  }, []);

  // Patient actions
  const addPatient = useCallback(async (patientData) => {
    try {
      const saved = await apiCreatePatient(patientData);
      setPatients(prev => [saved, ...prev.filter(p => p.patientId !== saved.patientId)]);
      showToast(translations[language]?.patient?.patientSaved || 'Patient saved successfully!');
      return saved;
    } catch (error) {
      showToast(getErrorMessage(error));
      throw error;
    }
  }, [language, showToast]);

  const updatePatient = useCallback((patientId, updatedData) => {
    showToast('Patient updates must be saved through the patient API.');
  }, [showToast]);

  // Screening actions
  const saveScreening = useCallback(async (screeningData) => {
    try {
      const saved = await apiCreateScreening(screeningData);
      setScreenings(prev => [saved, ...prev.filter(s => s.screeningId !== saved.screeningId)]);
      showToast(translations[language]?.result?.saved || 'Screening saved to records!');
      return saved;
    } catch (error) {
      showToast(getErrorMessage(error));
      throw error;
    }
  }, [language, showToast]);

  // Report actions
  const saveReport = useCallback(async (reportData) => {
    try {
      const saved = await apiCreateReport(reportData.screeningId || 'SCR-001', reportData);
      setReports(prev => [saved, ...prev.filter(r => r.reportId !== saved.reportId)]);
      showToast(translations[language]?.report?.reportSaved || 'Report saved to archive!');
      return saved;
    } catch (error) {
      showToast(getErrorMessage(error));
      throw error;
    }
  }, [language, showToast]);

  // Data reset
  const resetAllData = useCallback(() => {
    showToast('Local data reset is disabled. Clinical records are managed by the backend.');
  }, [showToast]);

  const value = {
    theme,
    setTheme: toggleTheme,
    language,
    toggleLanguage,
    backendOnline,
    patients,
    addPatient,
    updatePatient,
    screenings,
    saveScreening,
    reports,
    saveReport,
    selectedPatient,
    setSelectedPatient,
    uploadedImage,
    setUploadedImage,
    latestResult,
    setLatestResult,
    resetAllData,
    toastMessage,
    showToast,
    t,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className={`toast ${toastMessage ? 'show' : ''}`} role="alert">
        {toastMessage}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
