import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Languages,
  Bell,
  ScanEye,
  FileText,
  ShieldCheck,
  Smartphone,
  Eye,
  Info,
  RotateCcw,
  Check,
  Save,
  Trash2,
  ArrowDownToLine,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const {
    setTheme,
    language,
    setLanguage,
    backendOnline,
    isOffline,
    showToast,
    t
  } = useApp();

  // 1. APPEARANCE STATE
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('retina_theme_mode') || 'light';
  });

  const [density, setDensity] = useState(() => {
    return localStorage.getItem('retina_density') || 'comfortable';
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('retina_reduced_motion') === 'true';
  });

  // Apply appearance settings to documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem('retina_density', density);
  }, [density]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduced-motion', reducedMotion ? 'true' : 'false');
    localStorage.setItem('retina_reduced_motion', reducedMotion ? 'true' : 'false');
  }, [reducedMotion]);

  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('retina_theme_mode', mode);

    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(mode);
    }
  };

  // 2. NOTIFICATIONS STATE
  const [notifyScreening, setNotifyScreening] = useState(() => {
    return localStorage.getItem('retina_notify_screening') !== 'false';
  });
  const [notifyReport, setNotifyReport] = useState(() => {
    return localStorage.getItem('retina_notify_report') !== 'false';
  });
  const [notifyOffline, setNotifyOffline] = useState(() => {
    return localStorage.getItem('retina_notify_offline') !== 'false';
  });

  const handleToggleNotify = (setter, key, val) => {
    setter(val);
    localStorage.setItem(key, val ? 'true' : 'false');
    showToast('Notification preferences updated');
  };

  // 3. SCREENING PREFERENCES STATE
  const [qualityCheck, setQualityCheck] = useState(() => {
    return localStorage.getItem('retina_pref_quality_check') !== 'false';
  });
  const [autoOpenResult, setAutoOpenResult] = useState(() => {
    return localStorage.getItem('retina_pref_auto_open') !== 'false';
  });
  const [attentionMapPref, setAttentionMapPref] = useState(() => {
    return localStorage.getItem('retina_pref_attention_map') || 'always';
  });

  const handleSaveScreeningPref = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, typeof val === 'boolean' ? (val ? 'true' : 'false') : val);
    showToast('Screening preference updated');
  };

  // 4. REPORT PREFERENCES STATE
  const [clinicName, setClinicName] = useState(() => {
    return localStorage.getItem('retina_clinic_name') || 'AI Retina Tele-Ophthalmology Centre';
  });
  const [doctorName, setDoctorName] = useState(() => {
    return localStorage.getItem('retina_doctor_name') || 'Dr. S. Mehta, MS (Ophthalmology)';
  });
  const [autoDownloadReport, setAutoDownloadReport] = useState(() => {
    return localStorage.getItem('retina_pref_auto_download_report') === 'true';
  });
  const [includeGradcam, setIncludeGradcam] = useState(() => {
    return localStorage.getItem('retina_report_gradcam') !== 'false';
  });
  const [isReportSaved, setIsReportSaved] = useState(false);

  const handleSaveReportPrefs = (e) => {
    e.preventDefault();
    localStorage.setItem('retina_clinic_name', clinicName);
    localStorage.setItem('retina_doctor_name', doctorName);
    localStorage.setItem('retina_pref_auto_download_report', autoDownloadReport ? 'true' : 'false');
    localStorage.setItem('retina_report_gradcam', includeGradcam ? 'true' : 'false');
    setIsReportSaved(true);
    showToast('Clinical report configuration saved');
    setTimeout(() => setIsReportSaved(false), 2000);
  };

  // 5. ACCESSIBILITY STATE
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('retina_high_contrast') === 'true';
  });
  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem('retina_large_text') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-high-contrast', highContrast ? 'true' : 'false');
    localStorage.setItem('retina_high_contrast', highContrast ? 'true' : 'false');
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-large-text', largeText ? 'true' : 'false');
    localStorage.setItem('retina_large_text', largeText ? 'true' : 'false');
  }, [largeText]);

  // 6. MODALS STATE
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);
  const [isResetPrefsModalOpen, setIsResetPrefsModalOpen] = useState(false);

  // Clear local cache handler
  const handleConfirmClearCache = () => {
    sessionStorage.clear();
    localStorage.removeItem('retina_pwa_banner_dismissed');
    setIsClearCacheModalOpen(false);
    showToast('Local application cache cleared successfully');
  };

  // Reset preferences to default handler
  const handleConfirmResetPrefs = () => {
    localStorage.removeItem('retina_theme_mode');
    localStorage.removeItem('retina_density');
    localStorage.removeItem('retina_reduced_motion');
    localStorage.removeItem('retina_notify_screening');
    localStorage.removeItem('retina_notify_report');
    localStorage.removeItem('retina_notify_offline');
    localStorage.removeItem('retina_pref_quality_check');
    localStorage.removeItem('retina_pref_auto_open');
    localStorage.removeItem('retina_pref_attention_map');
    localStorage.removeItem('retina_clinic_name');
    localStorage.removeItem('retina_doctor_name');
    localStorage.removeItem('retina_pref_auto_download_report');
    localStorage.removeItem('retina_report_gradcam');
    localStorage.removeItem('retina_high_contrast');
    localStorage.removeItem('retina_large_text');

    setThemeMode('light');
    setTheme('light');
    setDensity('comfortable');
    setReducedMotion(false);
    setLanguage('en');
    setNotifyScreening(true);
    setNotifyReport(true);
    setNotifyOffline(true);
    setQualityCheck(true);
    setAutoOpenResult(true);
    setAttentionMapPref('always');
    setClinicName('AI Retina Tele-Ophthalmology Centre');
    setDoctorName('Dr. S. Mehta, MS (Ophthalmology)');
    setAutoDownloadReport(false);
    setIncludeGradcam(true);
    setHighContrast(false);
    setLargeText(false);

    setIsResetPrefsModalOpen(false);
    showToast('User preferences reset to clinical defaults');
  };

  return (
    <div className="page" id="settings-page">
      {/* Page Header */}
      <div className="page-header flex-between settings-header-row">
        <div>
          <h1 className="page-title">{t('settings.title') || 'Settings'}</h1>
          <p className="page-subtitle">Configure clinical screening preferences, interface behavior, and platform options</p>
        </div>

        <button
          className="btn btn-ghost btn-sm reset-prefs-btn"
          onClick={() => setIsResetPrefsModalOpen(true)}
          id="open-reset-prefs-btn"
          title="Reset preferences to default values"
        >
          <RotateCcw size={15} />
          <span>Reset Preferences</span>
        </button>
      </div>

      <div className="settings-grid">
        {/* ========================================================
            COLUMN 1: Appearance, Language, Notifications, Screening
            ======================================================== */}
        <div className="settings-col stack">
          {/* 1. APPEARANCE */}
          <section className="glass-card settings-card" id="section-appearance">
            <div className="section-header-title">
              <Palette size={18} className="settings-section-icon" />
              <h3>Appearance</h3>
            </div>
            <p className="settings-section-desc">Customize theme illumination, interface density, and display motion</p>

            <div className="settings-control-group">
              {/* Theme Mode */}
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Theme Mode</span>
                  <span className="control-desc">Select visual illumination scheme</span>
                </div>
                <div className="segmented-control" role="radiogroup" aria-label="Theme mode selection">
                  <button
                    type="button"
                    className={`seg-btn ${themeMode === 'light' ? 'seg-active' : ''}`}
                    onClick={() => handleThemeModeChange('light')}
                  >
                    <Sun size={14} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${themeMode === 'dark' ? 'seg-active' : ''}`}
                    onClick={() => handleThemeModeChange('dark')}
                  >
                    <Moon size={14} />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${themeMode === 'system' ? 'seg-active' : ''}`}
                    onClick={() => handleThemeModeChange('system')}
                  >
                    <Monitor size={14} />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Interface Density */}
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Interface Density</span>
                  <span className="control-desc">Adjust padding and component spacing</span>
                </div>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`seg-btn ${density === 'comfortable' ? 'seg-active' : ''}`}
                    onClick={() => setDensity('comfortable')}
                  >
                    <span>Comfortable</span>
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${density === 'compact' ? 'seg-active' : ''}`}
                    onClick={() => setDensity('compact')}
                  >
                    <span>Compact</span>
                  </button>
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Reduced Motion</span>
                  <span className="control-desc">Minimize interface transitions and animations</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* 2. LANGUAGE */}
          <section className="glass-card settings-card" id="section-language">
            <div className="section-header-title">
              <Languages size={18} className="settings-section-icon" />
              <h3>Language</h3>
            </div>
            <p className="settings-section-desc">Select your preferred clinical interface and report language</p>

            <div className="settings-control-group">
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Active Language</span>
                  <span className="control-desc">Currently selected: {language === 'hi' ? 'हिंदी (Hindi)' : 'English'}</span>
                </div>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`seg-btn ${language === 'en' ? 'seg-active' : ''}`}
                    onClick={() => setLanguage('en')}
                  >
                    <span>English</span>
                    {language === 'en' && <Check size={13} />}
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${language === 'hi' ? 'seg-active' : ''}`}
                    onClick={() => setLanguage('hi')}
                  >
                    <span>हिंदी</span>
                    {language === 'hi' && <Check size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. NOTIFICATIONS */}
          <section className="glass-card settings-card" id="section-notifications">
            <div className="section-header-title">
              <Bell size={18} className="settings-section-icon" />
              <h3>Notifications</h3>
            </div>
            <p className="settings-section-desc">Configure in-app alerts and workflow notifications</p>

            <div className="settings-control-group">
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Screening Completion Alert</span>
                  <span className="control-desc">Notify when AI retinal analysis finishes</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifyScreening}
                    onChange={(e) => handleToggleNotify(setNotifyScreening, 'retina_notify_screening', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Report Generation Alert</span>
                  <span className="control-desc">Notify when clinical PDF report is ready</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifyReport}
                    onChange={(e) => handleToggleNotify(setNotifyReport, 'retina_notify_report', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Offline Status Alert</span>
                  <span className="control-desc">Display banner when connection status changes</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifyOffline}
                    onChange={(e) => handleToggleNotify(setNotifyOffline, 'retina_notify_offline', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* 4. SCREENING PREFERENCES */}
          <section className="glass-card settings-card" id="section-screening-prefs">
            <div className="section-header-title">
              <ScanEye size={18} className="settings-section-icon" />
              <h3>Screening Preferences</h3>
            </div>
            <p className="settings-section-desc">Customize fundus evaluation workflow and attention map behavior</p>

            <div className="settings-control-group">
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Image Quality Verification</span>
                  <span className="control-desc">Validate resolution and aspect ratio before analysis</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={qualityCheck}
                    onChange={(e) => handleSaveScreeningPref('retina_pref_quality_check', e.target.checked, setQualityCheck)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Auto-Open Result</span>
                  <span className="control-desc">Navigate directly to evaluation when screening completes</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoOpenResult}
                    onChange={(e) => handleSaveScreeningPref('retina_pref_auto_open', e.target.checked, setAutoOpenResult)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">AI Attention Map (Grad-CAM)</span>
                  <span className="control-desc">Display heatmap automatically or on request</span>
                </div>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`seg-btn ${attentionMapPref === 'always' ? 'seg-active' : ''}`}
                    onClick={() => handleSaveScreeningPref('retina_pref_attention_map', 'always', setAttentionMapPref)}
                  >
                    <span>Always</span>
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${attentionMapPref === 'on_demand' ? 'seg-active' : ''}`}
                    onClick={() => handleSaveScreeningPref('retina_pref_attention_map', 'on_demand', setAttentionMapPref)}
                  >
                    <span>On Demand</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================
            COLUMN 2: Reports, Data & Privacy, App/PWA, Accessibility, About
            ======================================================== */}
        <div className="settings-col stack">
          {/* 5. REPORT PREFERENCES */}
          <section className="glass-card settings-card" id="section-report-prefs">
            <div className="section-header-title">
              <FileText size={18} className="settings-section-icon" />
              <h3>Report Preferences</h3>
            </div>
            <p className="settings-section-desc">Customize header information rendered on official clinical reports</p>

            <form onSubmit={handleSaveReportPrefs} className="report-settings-form">
              <div className="form-group">
                <label className="form-label">Clinic / Hospital Facility Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. AI Retina Tele-Ophthalmology Centre"
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Attending Ophthalmologist / Examiner</label>
                <input
                  type="text"
                  className="form-input"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. S. Mehta, MS (Ophthalmology)"
                  required
                />
              </div>

              <div className="settings-control-group" style={{ marginTop: 14 }}>
                <div className="settings-control-item" style={{ padding: '8px 0' }}>
                  <div className="control-label-wrap">
                    <span className="control-title">Include Grad-CAM Heatmap</span>
                    <span className="control-desc">Attach AI attention map to generated PDF reports</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={includeGradcam}
                      onChange={(e) => setIncludeGradcam(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-control-item" style={{ padding: '8px 0' }}>
                  <div className="control-label-wrap">
                    <span className="control-title">Auto-Download PDF Report</span>
                    <span className="control-desc">Prompt PDF download immediately upon opening report</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={autoDownloadReport}
                      onChange={(e) => setAutoDownloadReport(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
                {isReportSaved ? <Check size={14} /> : <Save size={14} />}
                <span>{isReportSaved ? 'Preferences Saved' : 'Save Report Defaults'}</span>
              </button>
            </form>
          </section>

          {/* 6. DATA & PRIVACY */}
          <section className="glass-card settings-card" id="section-data-privacy">
            <div className="section-header-title">
              <ShieldCheck size={18} className="settings-section-icon" />
              <h3>Data & Privacy</h3>
            </div>
            <p className="settings-section-desc">Clinical data governance, local cache management, and confidentiality</p>

            <div className="settings-control-group">
              <div className="privacy-assurance-box">
                <div className="privacy-badge">
                  <ShieldCheck size={14} />
                  <span>Clinical Confidentiality Protected</span>
                </div>
                <p className="privacy-text">
                  Patient Health Information (PHI) and fundus imagery are transmitted securely via encrypted TLS 1.3 channels. Screening records remain strictly governed within your designated MongoDB Atlas instance.
                </p>
              </div>

              <div className="settings-control-item" style={{ marginTop: 12 }}>
                <div className="control-label-wrap">
                  <span className="control-title">Local Browser Cache</span>
                  <span className="control-desc">Temporary offline drafts and session storage</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsClearCacheModalOpen(true)}
                  id="clear-cache-btn"
                >
                  <Trash2 size={14} />
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>
          </section>

          {/* 7. APP / PWA */}
          <section className="glass-card settings-card" id="section-app-pwa">
            <div className="section-header-title">
              <Smartphone size={18} className="settings-section-icon" />
              <h3>Application & PWA</h3>
            </div>
            <p className="settings-section-desc">Progressive Web Application installation status and connectivity</p>

            <div className="settings-control-group">
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Installation Status</span>
                  <span className="control-desc">
                    {isInstalled
                      ? 'Installed and operating in standalone clinical mode'
                      : isInstallable
                      ? 'Available to install on this device for offline capability'
                      : 'Running in standard web browser'}
                  </span>
                </div>
                {isInstalled ? (
                  <span className="table-status-pill pill-safe" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Installed
                  </span>
                ) : isInstallable ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={promptInstall}
                    id="settings-pwa-install-btn"
                  >
                    <ArrowDownToLine size={14} />
                    <span>Install App</span>
                  </button>
                ) : (
                  <span className="table-status-pill pill-neutral">Browser Mode</span>
                )}
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Backend Inference Status</span>
                  <span className="control-desc">PyTorch Deep Learning Engine connection</span>
                </div>
                <div className={`status-pill ${backendOnline ? 'status-pill-online' : 'status-pill-offline'}`}>
                  <span className="status-indicator-dot"></span>
                  {backendOnline ? 'PyTorch Server Active' : isOffline ? 'Device Offline' : 'Connecting...'}
                </div>
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Application Version</span>
                  <span className="control-desc">Production Build</span>
                </div>
                <span className="version-pill">v2.4.0</span>
              </div>
            </div>
          </section>

          {/* 8. ACCESSIBILITY */}
          <section className="glass-card settings-card" id="section-accessibility">
            <div className="section-header-title">
              <Eye size={18} className="settings-section-icon" />
              <h3>Accessibility</h3>
            </div>
            <p className="settings-section-desc">Enhanced contrast and reading readability options</p>

            <div className="settings-control-group">
              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">High Contrast Mode</span>
                  <span className="control-desc">Increase border clarity and text-to-background contrast</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="settings-control-item">
                <div className="control-label-wrap">
                  <span className="control-title">Larger Text</span>
                  <span className="control-desc">Increase font scale across clinical cards and labels</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={largeText}
                    onChange={(e) => setLargeText(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* 9. ABOUT */}
          <section className="glass-card settings-card" id="section-about">
            <div className="section-header-title">
              <Info size={18} className="settings-section-icon" />
              <h3>About Retina AI</h3>
            </div>
            <p className="settings-text-block">
              Retina AI is a specialized clinical deep learning platform designed for rapid automated screening of diabetic retinopathy and multi-disease retinal pathologies from standard fundus photography.
            </p>

            <div className="supported-conditions-list">
              <span className="supported-title">Supported Clinical Conditions:</span>
              <ul className="conditions-grid">
                <li>Diabetic Retinopathy (Stages 0 – 4)</li>
                <li>Age-Related Macular Degeneration (AMD)</li>
                <li>Branch Retinal Vein Occlusion (BRVO)</li>
                <li>Glaucoma & Optic Disc Cupping</li>
                <li>Cataract & Pathological Myopia</li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* Professional Medical Safety Note */}
      <div className="glass-card medical-disclaimer-card" id="settings-notice" style={{ marginTop: 28 }}>
        <div className="disclaimer-icon">
          <ShieldAlert size={20} />
        </div>
        <div className="disclaimer-content">
          <strong>Clinical Notice:</strong> AI-generated screening results should be reviewed by a qualified eye-care professional.
        </div>
      </div>

      {/* ========================================================
          MODAL: CLEAR LOCAL CACHE CONFIRMATION
          ======================================================== */}
      {isClearCacheModalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsClearCacheModalOpen(false)}>
          <div className="modal-container glass-card settings-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-icon-disc alert-disc">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="dialog-title">Clear Local Cache?</h3>
                <p className="dialog-subtitle">Temporary browser storage cleanup</p>
              </div>
            </div>

            <p className="dialog-body">
              This will clear temporary offline cache and session preferences in this browser.
              <strong> Patient records, screenings, and reports on MongoDB Atlas will NOT be affected.</strong>
            </p>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsClearCacheModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleConfirmClearCache}
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RESET PREFERENCES CONFIRMATION
          ======================================================== */}
      {isResetPrefsModalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsResetPrefsModalOpen(false)}>
          <div className="modal-container glass-card settings-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-icon-disc warn-disc">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="dialog-title">Reset User Preferences?</h3>
                <p className="dialog-subtitle">Restore default clinical settings</p>
              </div>
            </div>

            <p className="dialog-body">
              This will reset all theme, display, language, and report configuration preferences to their standard defaults.
              <strong> Your patient profiles and screening database remain completely untouched.</strong>
            </p>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsResetPrefsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmResetPrefs}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
