import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Globe,
  Moon,
  Sun,
  Info,
  Check,
  Cpu,
  ShieldAlert,
  Lock,
  Database,
  RefreshCw,
  Server,
  Sparkles,
  Building2,
  UserCheck,
  Save,
  Smartphone,
  CheckCircle2,
  ArrowDownToLine
} from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const {
    language,
    toggleLanguage,
    theme,
    setTheme,
    backendOnline,
    showToast,
    t
  } = useApp();

  const [showModelDetails, setShowModelDetails] = useState(true);

  // Clinic & Doctor preferences
  const [clinicName, setClinicName] = useState(() => {
    return localStorage.getItem('retina_clinic_name') || 'AI Retina Tele-Ophthalmology Centre';
  });
  const [doctorName, setDoctorName] = useState(() => {
    return localStorage.getItem('retina_doctor_name') || 'Dr. S. Mehta, MS (Ophthalmology)';
  });
  const [includeGradcam, setIncludeGradcam] = useState(() => {
    return localStorage.getItem('retina_report_gradcam') !== 'false';
  });
  const [isSavedPrefs, setIsSavedPrefs] = useState(false);

  const handleSaveReportPrefs = (e) => {
    e.preventDefault();
    localStorage.setItem('retina_clinic_name', clinicName);
    localStorage.setItem('retina_doctor_name', doctorName);
    localStorage.setItem('retina_report_gradcam', includeGradcam ? 'true' : 'false');
    setIsSavedPrefs(true);
    showToast('Report clinical preferences saved');
    setTimeout(() => setIsSavedPrefs(false), 2500);
  };

  return (
    <div className="page" id="settings-page">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">Configure clinical screening preferences and inspect platform architecture</p>
      </div>

      <div className="settings-stack stack stagger-children">
        {/* Language Selection */}
        <div className="glass-card settings-card" id="language-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <Globe size={20} className="settings-icon" />
              <div>
                <span className="settings-label">{t('settings.language')}</span>
                <span className="settings-desc">Choose application language (English / हिंदी)</span>
              </div>
            </div>

            <div className="lang-toggle-group">
              <button
                className={`lang-btn ${language === 'en' ? 'lang-active' : ''}`}
                onClick={language === 'hi' ? toggleLanguage : undefined}
                id="lang-en-btn"
              >
                English {language === 'en' && <Check size={14} />}
              </button>
              <button
                className={`lang-btn ${language === 'hi' ? 'lang-active' : ''}`}
                onClick={language === 'en' ? toggleLanguage : undefined}
                id="lang-hi-btn"
              >
                हिंदी {language === 'hi' && <Check size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="glass-card settings-card" id="theme-card">
          <div className="settings-row">
            <div className="settings-row-info">
              {theme === 'dark' ? (
                <Moon size={20} className="settings-icon" />
              ) : (
                <Sun size={20} className="settings-icon" />
              )}
              <div>
                <span className="settings-label">{t('settings.theme')}</span>
                <span className="settings-desc">Switch between pastel cyan light mode and high-contrast dark mode</span>
              </div>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={setTheme} id="theme-toggle-btn">
              {theme === 'dark' ? (
                <>
                  <Sun size={16} />
                  {t('settings.lightMode')}
                </>
              ) : (
                <>
                  <Moon size={16} />
                  {t('settings.darkMode')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Header & Facility Customization */}
        <div className="glass-card settings-card" id="report-settings-card">
          <div className="settings-section-wrap">
            <div className="settings-section-title">
              <Building2 size={20} className="settings-icon" />
              <div>
                <h3>Clinical Report & Practice Configuration</h3>
                <span className="settings-desc">Customize header information rendered on official PDF reports</span>
              </div>
            </div>

            <form onSubmit={handleSaveReportPrefs} className="report-config-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={13} style={{ display: 'inline', marginRight: 5 }} />
                    Healthcare Facility / Hospital Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. AI Retina Tele-Ophthalmology Centre"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <UserCheck size={13} style={{ display: 'inline', marginRight: 5 }} />
                    Default Attending Ophthalmologist
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. S. Mehta, MS (Ophthalmology)"
                    required
                  />
                </div>
              </div>

              <div className="settings-row" style={{ marginTop: 12, padding: 0 }}>
                <label className="checkbox-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={includeGradcam}
                    onChange={(e) => setIncludeGradcam(e.target.checked)}
                  />
                  <span>Automatically attach Grad-CAM Explainability heatmap to generated PDF reports</span>
                </label>

                <button type="submit" className="btn btn-primary btn-sm">
                  <Save size={15} />
                  {isSavedPrefs ? 'Saved!' : 'Save Report Defaults'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Backend & MongoDB Atlas Status */}
        <div className="glass-card settings-card" id="api-status-card">
          <div className="settings-section-wrap">
            <div className="settings-row" style={{ padding: 0 }}>
              <div className="settings-row-info">
                <Server size={20} className="settings-icon" />
                <div>
                  <span className="settings-label">FastAPI & PyTorch Inference Engine</span>
                  <span className="settings-desc">
                    Endpoint: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                  </span>
                </div>
              </div>

              <div className={`status-pill ${backendOnline ? 'status-pill-online' : 'status-pill-offline'}`}>
                <span className="status-indicator-dot"></span>
                {backendOnline ? 'PyTorch Server Active' : 'Offline / Standalone Fallback'}
              </div>
            </div>

            <div className="mongodb-details-box">
              <div className="mongo-row">
                <Database size={15} className="mongo-icon" />
                <span className="mongo-label">MongoDB Atlas Persistence:</span>
                <span className="mongo-val">
                  <code>retina_ai</code> database (Collections: <code>patients</code>, <code>screenings</code>, <code>reports</code>)
                </span>
              </div>
              <span className="mongo-note">
                Automatic synchronization enabled with offline fallback resilience.
              </span>
            </div>
          </div>
        </div>

        {/* Model Information Card */}
        <div className="glass-card settings-card" id="model-info-card">
          <div className="settings-section-wrap">
            <div className="settings-row" style={{ padding: 0 }}>
              <div className="settings-section-title">
                <Cpu size={20} className="settings-icon" />
                <div>
                  <h3>{t('settings.modelTitle')}</h3>
                  <span className="settings-desc">Multitask deep neural network architecture and training benchmarks</span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModelDetails(prev => !prev)}
                id="toggle-model-details-btn"
              >
                <Sparkles size={14} />
                {showModelDetails ? 'Hide Details' : 'View Architecture'}
              </button>
            </div>

            {showModelDetails && (
              <div className="model-details-box animate-fade-in">
                <div className="model-detail-item">
                  <strong>Deep Learning Architecture:</strong>
                  <span>EfficientNet-B0 Multitask Network (PyTorch)</span>
                </div>
                <div className="model-detail-item">
                  <strong>Model Checkpoint Weights:</strong>
                  <code>retina_project_v4_best.pth</code>
                </div>
                <div className="model-detail-item">
                  <strong>Training Benchmarks:</strong>
                  <span>APTOS 2019 Blindness Detection, RFMiD (Retinal Fundus Multi-Disease), ODIR-5K</span>
                </div>
                <div className="model-detail-item">
                  <strong>Explainability (XAI):</strong>
                  <span>Grad-CAM (Gradient-weighted Class Activation Mapping) generated on the final convolutional feature layer</span>
                </div>
                <div className="model-detail-item">
                  <strong>Target Diagnoses:</strong>
                  <span>
                    Diabetic Retinopathy (5 Severity Stages), AMD / ARMD (Age-Related Macular Degeneration), Branch Retinal Vein Occlusion (BRVO), Optic Disc Cupping (ODC), Glaucoma, Cataract, Pathological Myopia
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Retina AI Card */}
        <div className="glass-card settings-card" id="about-card">
          <div className="settings-section-wrap">
            <div className="settings-section-title">
              <Info size={20} className="settings-icon" />
              <h3>{t('settings.aboutTitle')}</h3>
            </div>
            <p className="settings-text-block">{t('settings.aboutDesc')}</p>
          </div>
        </div>

        {/* Medical Disclaimer Card */}
        <div className="glass-card settings-card disclaimer-settings-card" id="disclaimer-card">
          <div className="settings-section-wrap">
            <div className="settings-section-title">
              <ShieldAlert size={20} className="settings-icon alert-icon" />
              <h3>{t('settings.disclaimerTitle')}</h3>
            </div>
            <p className="settings-text-block disclaimer-text">
              {t('settings.disclaimerText')}
            </p>
            <p className="settings-text-block disclaimer-text" style={{ marginTop: 8 }}>
              {t('settings.xaiDisclaimer')}
            </p>
          </div>
        </div>

        {/* Privacy & Clinical Data Governance */}
        <div className="glass-card settings-card" id="privacy-card">
          <div className="settings-section-wrap">
            <div className="settings-section-title">
              <Lock size={20} className="settings-icon" />
              <h3>{t('settings.privacyTitle')}</h3>
            </div>
            <p className="settings-text-block">{t('settings.privacyDesc')}</p>
          </div>
        </div>

        {/* Progressive Web App (PWA) Card */}
        <div className="glass-card settings-card" id="pwa-settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <Smartphone size={20} className="settings-icon" />
              <div>
                <span className="settings-label">Progressive Web Application (PWA)</span>
                <span className="settings-desc">
                  {isInstalled
                    ? 'Retina AI is installed and running in standalone clinical mode.'
                    : 'Install Retina AI on your device for fast access and offline application shell.'}
                </span>
              </div>
            </div>

            {isInstalled ? (
              <span className="table-status-pill pill-safe" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Installed
              </span>
            ) : isInstallable ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={promptInstall}
                id="settings-install-pwa-btn"
                aria-label="Install Retina AI PWA"
                title="Install Retina AI"
              >
                <ArrowDownToLine size={15} />
                Install App
              </button>
            ) : (
              <span className="table-status-pill pill-neutral">Browser Mode</span>
            )}
          </div>
        </div>

        {/* Clinical Data Management */}
        <div className="glass-card settings-card" id="data-management-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <Database size={20} className="settings-icon" />
              <div>
                <span className="settings-label">Screening Data Management</span>
                <span className="settings-desc">Reset screening records and patient profiles to standard verified state</span>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={resetRecords}
              id="reset-records-btn"
            >
              <RefreshCw size={15} />
              {t('settings.resetData')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
