import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SeverityBadge from '../components/SeverityBadge';
import PatientFormModal from '../components/PatientFormModal';
import InstallBanner from '../components/InstallBanner';
import {
  Users,
  ScanEye,
  FileText,
  AlertTriangle,
  Plus,
  ArrowRight,
  Eye,
  Layers,
  ShieldCheck,
  Zap,
  ChevronRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { patients, screenings, reports, setSelectedPatient, t } = useApp();
  const navigate = useNavigate();
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const totalPatients = patients.length;
  const totalScreenings = screenings.length;
  const reportsGenerated = reports.length;
  const requiringReview = patients.filter(
    p => p.diabetesStatus === 'Yes' || p.previousEyeDisease !== 'None'
  ).length;

  const stats = [
    {
      label: t('dashboard.totalPatients'),
      value: totalPatients,
      icon: Users,
      color: 'var(--accent-primary)',
      sub: 'Registered profiles'
    },
    {
      label: t('dashboard.totalScreenings'),
      value: totalScreenings,
      icon: ScanEye,
      color: '#3b82f6',
      sub: 'AI evaluated fundus'
    },
    {
      label: t('dashboard.reportsGenerated'),
      value: reportsGenerated,
      icon: FileText,
      color: 'var(--accent-safe)',
      sub: 'Archived clinical reports'
    },
    {
      label: t('dashboard.requiringReview'),
      value: requiringReview,
      icon: AlertTriangle,
      color: 'var(--accent-alert)',
      sub: 'Diabetic & symptom suspect'
    }
  ];

  // Features list
  const features = [
    {
      icon: Eye,
      title: 'Diabetic Retinopathy Classification',
      desc: 'Detects 5 DR stages from fundus images (Stage 0 to Stage 4).',
      badge: '5 DR Stages'
    },
    {
      icon: Layers,
      title: 'Multi-Disease Screening',
      desc: 'Screens for additional retinal conditions including AMD/ARMD, BRVO, glaucoma, cataract, and myopia.',
      badge: 'Multi-Condition'
    },
    {
      icon: ShieldCheck,
      title: 'AI Explainability (Grad-CAM)',
      desc: 'Generates attention heatmaps highlighting retinal regions that contributed to the model prediction.',
      badge: 'Grad-CAM XAI'
    },
    {
      icon: Zap,
      title: 'Fast Automated Screening',
      desc: 'Provides instant automated evaluation with comprehensive clinical PDF report generation.',
      badge: 'Instant Inference'
    }
  ];

  // Recent screenings — live data only (no mock/sample data)
  const recentScreeningsList = screenings.slice(0, 5);

  const quickActions = [
    {
      title: '+ New Patient',
      desc: 'Register clinical intake profile',
      icon: Users,
      action: () => setIsPatientModalOpen(true),
      btnStyle: 'btn-ghost'
    },
    {
      title: '+ New Screening',
      desc: 'Upload fundus for AI screening',
      icon: ScanEye,
      action: () => navigate('/screening'),
      btnStyle: 'btn-primary'
    },
    {
      title: 'View Patients',
      desc: 'Browse patient directory',
      icon: Users,
      action: () => navigate('/patients'),
      btnStyle: 'btn-ghost'
    },
    {
      title: 'View Reports',
      desc: 'Inspect archived clinical reports',
      icon: FileText,
      action: () => navigate('/reports'),
      btnStyle: 'btn-ghost'
    }
  ];

  return (
    <div className="page" id="dashboard-page">
      {/* PWA Install Prompt Banner */}
      <InstallBanner />

      {/* Top Welcome Header & Main CTA */}
      <div className="page-header flex-between dashboard-header-row">
        <div>
          <div className="dashboard-pill">
            <span className="pill-dot"></span>
            Retina AI Screening Platform
          </div>
          <h1 className="page-title">{t('dashboard.greeting')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>

        <button
          className="btn btn-primary btn-lg main-cta-btn"
          onClick={() => navigate('/screening')}
          id="dashboard-new-screening-btn"
        >
          <Plus size={20} />
          {t('dashboard.newScreening')}
        </button>
      </div>

      {/* KPI Statistics (4 Cards) */}
      <div className="grid-4 stagger-children" id="dashboard-stats">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div className="glass-card stat-card" key={i}>
              <div className="stat-icon-row">
                <div className="stat-icon" style={{ background: `${stat.color}18`, color: stat.color }}>
                  <Icon size={20} />
                </div>
                <span className="stat-sub-label">{stat.sub}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Grid */}
      <div className="quick-actions-section">
        <h2 className="section-title">{t('dashboard.quickActions')}</h2>
        <div className="quick-actions-grid">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <div
                key={i}
                className="glass-card quick-action-card"
                onClick={qa.action}
              >
                <div className="qa-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="qa-text-wrap">
                  <strong className="qa-title">{qa.title}</strong>
                  <span className="qa-desc">{qa.desc}</span>
                </div>
                <ChevronRight size={16} className="qa-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Screenings Section */}
      <div className="recent-section">
        <div className="flex-between recent-header">
          <div>
            <h2 className="section-title">{t('dashboard.recentScreenings')}</h2>
            <p className="section-subtitle">Verified patient fundus screening sessions</p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/reports')}
          >
            {t('dashboard.viewAll')}
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="stack stagger-children">
          {recentScreeningsList.map((sc, i) => (
            <div
              key={i}
              className="glass-card patient-row"
              onClick={() => navigate(`/result/${sc.screeningId}`)}
            >
              <div className="patient-left-cluster">
                <div className="patient-avatar-disc">
                  <Eye size={18} />
                </div>
                <div className="patient-row-info">
                  <div className="patient-name-line">
                    <span className="patient-name">{sc.patientName}</span>
                    <span className="screening-id-tag">{sc.screeningId}</span>
                  </div>
                  <span className="patient-meta">
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {sc.screeningDate} · {sc.findingsSummary}
                  </span>
                </div>
              </div>

              <div className="patient-right-cluster">
                <SeverityBadge severity={sc.drStage} />
                <button
                  className="btn btn-ghost btn-sm view-result-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/result/${sc.screeningId}`);
                  }}
                >
                  View Result
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Core Features */}
      <div className="features-section" style={{ marginTop: 32 }}>
        <div className="section-header-wrap">
          <h2 className="section-title">Core AI Screening Capabilities</h2>
          <p className="section-subtitle">Integrated clinical deep learning modules</p>
        </div>
        <div className="grid-2 stagger-children features-grid">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div className="glass-card feature-card" key={i}>
                <div className="feature-top">
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>
                  <span className="feature-badge">{feat.badge}</span>
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Professional Medical Notice */}
      <div className="glass-card medical-disclaimer-card" id="dashboard-notice" style={{ marginTop: 24 }}>
        <div className="disclaimer-icon">
          <ShieldAlert size={20} />
        </div>
        <div className="disclaimer-content">
          <strong>Clinical Notice:</strong> {t('notice.medical')}
        </div>
      </div>

      {/* Patient Registration Modal */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onPatientSaved={(patient) => {
          setSelectedPatient(patient);
        }}
      />
    </div>
  );
}
