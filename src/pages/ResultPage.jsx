import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SeverityBadge from '../components/SeverityBadge';
import ReportModal from '../components/ReportModal';
import {
  Download,
  Save,
  ArrowLeft,
  FileText,
  Sparkles,
  Layers,
  Calendar,
  User,
  ShieldAlert,
  Maximize2,
  CheckCircle2,
  Info
} from 'lucide-react';
import './ResultPage.css';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    patients,
    screenings,
    latestResult,
    showToast,
    t
  } = useApp();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLargeImageModalOpen, setIsLargeImageModalOpen] = useState(false);

  const predData = useMemo(() => {
    // Only return latestResult if it matches the current screening ID in route (or if no ID specified)
    if (latestResult && (!id || latestResult.screeningId === id || latestResult.screening_id === id)) {
      return latestResult;
    }
    if (id && screenings && screenings.length > 0) {
      const match = screenings.find(s => s.screeningId === id || s.screening_id === id);
      if (match) {
        const parseStageVal = (val) => {
          if (val === undefined || val === null) return null;
          if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.min(4, Math.floor(val)));
          const cleaned = String(val).toLowerCase().replace(/[^0-9]/g, '');
          const parsed = parseInt(cleaned, 10);
          return !isNaN(parsed) ? Math.max(0, Math.min(4, parsed)) : null;
        };
        const stageNum = parseStageVal(match.drStageNumber) ?? parseStageVal(match.dr_stage) ?? parseStageVal(match.drStage) ?? 0;
        const defaultNames = { 0: 'No DR', 1: 'Mild DR', 2: 'Moderate DR', 3: 'Severe DR', 4: 'Proliferative DR' };
        let cleanLabel = defaultNames[stageNum];
        const rawLabel = match.drLabel || match.dr_label || match.drResult || match.dr_result;
        if (rawLabel) {
          const stripped = String(rawLabel).replace(/^Stage\s*\d+\s*[—–-]\s*/i, '').trim();
          if (stripped.toLowerCase() === 'severe') cleanLabel = 'Severe DR';
          else if (stripped.toLowerCase() === 'mild') cleanLabel = 'Mild DR';
          else if (stripped.toLowerCase() === 'moderate') cleanLabel = 'Moderate DR';
          else if (stripped.toLowerCase() === 'proliferative') cleanLabel = 'Proliferative DR';
          else if (stripped.toLowerCase() === 'no dr' || stripped.toLowerCase() === 'no') cleanLabel = 'No DR';
          else if (stripped) cleanLabel = stripped;
        }

        const rfmid = match.rfmidFindings || match.rfmid_findings || [];
        const odir = match.odirFindings || match.odir_findings || [];
        const combined = [...rfmid, ...odir].filter(f => f && String(f).toUpperCase() !== 'NORMAL');
        const uniqueFindings = Array.from(new Set(combined.map(f => (String(f).toUpperCase().includes('AMD') || String(f).toUpperCase().includes('ARMD')) ? 'AMD / ARMD' : f)));
        return {
          screeningId: match.screeningId || match.screening_id,
          screeningDate: match.screeningDate || match.screening_date,
          patientId: match.patientId || match.patient_id,
          drStage: `stage${stageNum}`,
          drStageNumber: stageNum,
          dr_stage: stageNum,
          dr_label: cleanLabel,
          drStageLabel: `Stage ${stageNum} — ${cleanLabel}`,
          imageUrl: match.imageUrl || match.image_url,
          heatmapDataUrl: match.gradcamUrl || match.gradcam_url,
          detectedFindings: uniqueFindings,
          explanation: 'Highlighted regions in the attention map contributed to the diabetic retinopathy classification.'
        };
      }
    }
    return null;
  }, [latestResult, id, screenings]);

  useEffect(() => {
    if (!predData) {
      showToast('No active screening result found.', 'error');
      navigate('/dashboard');
    }
  }, [predData, navigate, showToast]);

  if (!predData) {
    return null;
  }

  const screeningId = predData.screeningId;

  // Match patient record
  const currentPatient = useMemo(() => {
    return patients.find(p => p.patientId === predData.patientId) || null;
  }, [patients, predData]);

  const DR_STAGES = {
    0: { stage: 'Stage 0', label: 'No DR', desc: 'No clinical signs of diabetic retinopathy detected in fundus examination.' },
    1: { stage: 'Stage 1', label: 'Mild DR', desc: 'Microaneurysms detected in retinal vasculature.' },
    2: { stage: 'Stage 2', label: 'Moderate DR', desc: 'More than microaneurysms, but less than severe DR.' },
    3: { stage: 'Stage 3', label: 'Severe DR', desc: 'Severe retinal hemorrhages in 4 quadrants, venous beading, or IRMA.' },
    4: { stage: 'Stage 4', label: 'Proliferative DR', desc: 'Neovascularization or vitreous/preretinal hemorrhage present.' },
  };

  const stageNumber = useMemo(() => {
    const parseStageVal = (val) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.min(4, Math.floor(val)));
      const cleaned = String(val).toLowerCase().replace(/[^0-9]/g, '');
      const parsed = parseInt(cleaned, 10);
      return !isNaN(parsed) ? Math.max(0, Math.min(4, parsed)) : null;
    };
    return parseStageVal(predData.drStageNumber) ?? parseStageVal(predData.dr_stage) ?? parseStageVal(predData.drStage) ?? 0;
  }, [predData]);

  const drStageKey = `stage${stageNumber}`;
  const currentStageInfo = DR_STAGES[stageNumber] || DR_STAGES[0];
  const displayStageTitle = `${currentStageInfo.stage} — ${currentStageInfo.label}`;

  const fundusImg = predData.imageUrl;
  const heatmapImg = predData.heatmapDataUrl;

  const detectedFindings = predData.detectedFindings || [];
  const secondaryFindings = predData.secondaryFindings || [];

  const notableSecondary = detectedFindings.length > 0
    ? detectedFindings.join(', ')
    : 'No additional findings detected';

  const handleDownloadHeatmap = () => {
    if (!heatmapImg) {
      showToast('No heatmap available to download', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = heatmapImg;
    link.download = `RetinaAI_AttentionMap_${screeningId}.png`;
    link.click();
    showToast('Grad-CAM image downloaded');
  };

  const handleSaveResult = () => showToast(t('result.saved'));

  return (
    <div className="page" id="result-page">
      {/* Top Navigation & Back */}
      <div className="page-header flex-between result-header">
        <div>
          <button
            className="btn btn-ghost btn-sm back-btn"
            onClick={() => navigate('/dashboard')}
            id="result-back-btn"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="page-title">RETINA SCREENING RESULT</h1>
        </div>

        <div className="result-top-actions">
          <button
            className="btn btn-primary btn-lg generate-report-btn"
            onClick={() => setIsReportModalOpen(true)}
            id="generate-report-cta-btn"
          >
            <FileText size={20} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Patient & Screening Header Banner */}
      <div className="glass-card result-patient-banner" id="result-patient-banner">
        <div className="patient-banner-cluster">
          <div className="patient-banner-avatar">
            <User size={22} />
          </div>
          <div className="patient-banner-text">
            <div className="banner-name-row">
              <span className="banner-patient-label">Patient:</span>
              <strong className="banner-patient-name">{currentPatient?.fullName || predData.patientName}</strong>
              <span className="banner-patient-id">ID: {currentPatient?.patientId || predData.patientId}</span>
            </div>
            <div className="banner-meta-row">
              <span>{currentPatient?.age ?? '—'} yrs · {currentPatient?.gender || '—'}</span>
              <span>·</span>
              <span>Diabetes: {currentPatient?.diabetesStatus || '—'}</span>
              <span>·</span>
              <span>Hypertension: {currentPatient?.hypertension || '—'}</span>
            </div>
          </div>
        </div>

        <div className="banner-date-box">
          <Calendar size={15} />
          <span>Screening Date: <strong>{predData.screeningDate || new Date().toISOString().split('T')[0]}</strong></span>
        </div>
      </div>

      <div className="result-grid">
        {/* LEFT COLUMN: AI Attention Map (Grad-CAM XAI) */}
        <div className="result-col stack">
          <div className="glass-card result-card xai-section-card" id="ai-attention-map-card">
            <div className="card-top-bar">
              <div className="card-top-title">
                <Sparkles size={18} className="sparkle-icon" />
                <h3>{t('result.aiAttentionMap')}</h3>
              </div>
              <span className="tech-badge">Grad-CAM Heatmap</span>
            </div>

            {/* Left: Original Fundus | Right: Grad-CAM Heatmap */}
            <div className="attention-comparison-grid">
              <div className="comp-col">
                <span className="comp-label">LEFT: Original Fundus Image</span>
                <div className="comp-img-frame">
                  {fundusImg ? <img src={fundusImg} alt="Original Retinal Fundus" /> : <div className="no-image-placeholder">No Image Available</div>}
                </div>
              </div>

              <div className="comp-col">
                <span className="comp-label">RIGHT: Grad-CAM Attention Heatmap</span>
                <div className="comp-img-frame comp-heatmap-frame">
                  {fundusImg && <img src={fundusImg} alt="Fundus background" className="base-underlay" />}
                  {heatmapImg ? (
                    <img src={heatmapImg} alt="Grad-CAM Attention Heatmap" className="heatmap-overlay" />
                  ) : (
                    <div className="no-image-placeholder">Map Generation Failed</div>
                  )}
                </div>
              </div>
            </div>

            <p className="attention-short-explanation">
              {predData.explanation || t('result.attentionExplanation')}
            </p>

            <div className="attention-action-bar">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsLargeImageModalOpen(true)}
              >
                <Maximize2 size={14} />
                {t('result.viewLarger')}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDownloadHeatmap}
                disabled={!heatmapImg}
              >
                <Download size={14} />
                {t('result.downloadImage')}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DR Classification, Secondary Findings, Summary & Actions */}
        <div className="result-col stack">
          {/* DIABETIC RETINOPATHY (PROMINENT PREDICTED STAGE - ZERO CONFIDENCE PERCENTAGE) */}
          <div className="glass-card result-card dr-prominent-card" id="dr-prominent-card">
            <div className="dr-card-header">
              <span className="sub-label">DIABETIC RETINOPATHY</span>
              <SeverityBadge severity={drStageKey} size="lg" />
            </div>

            <div className="dr-stage-display">
              <h2 className="dr-stage-title">{displayStageTitle}</h2>
              <p className="dr-stage-desc-text">{currentStageInfo.desc}</p>
            </div>

            {/* Prominent Single Stage Confirmation Banner */}
            <div className="dr-single-stage-banner">
              <div className="single-stage-icon-wrap">
                <CheckCircle2 size={22} className="stage-check-icon" />
              </div>
              <div className="single-stage-info">
                <span className="single-stage-pill">{currentStageInfo.stage}</span>
                <strong className="single-stage-label">{currentStageInfo.label}</strong>
              </div>
            </div>
          </div>

          {/* OTHER RETINAL FINDINGS (COMBINED AMD/ARMD, NO PERCENTAGES) */}
          <div className="glass-card result-card" id="secondary-findings-card">
            <div className="card-top-bar">
              <div className="card-top-title">
                <Layers size={18} className="section-icon" />
                <h3>{t('result.otherFindings')}</h3>
              </div>
              <span className="findings-count-tag">
                {detectedFindings.length > 0 ? `${detectedFindings.length} Detected` : 'All Clear'}
              </span>
            </div>

            {detectedFindings.length > 0 ? (
              <div className="secondary-findings-grid">
                {detectedFindings.map((finding) => (
                  <div className="finding-pill-card glass-card finding-detected-card" key={finding}>
                    <span className="finding-label-text">{finding}</span>
                    <span className="finding-status-badge status-badge-possible">
                      Detected
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-findings-banner glass-card">
                <CheckCircle2 size={18} className="no-findings-icon" />
                <span>No additional findings detected</span>
              </div>
            )}
          </div>

          {/* SCREENING SUMMARY SECTION */}
          <div className="glass-card result-card summary-card" id="screening-summary-card">
            <div className="card-top-title" style={{ marginBottom: 12 }}>
              <Info size={18} className="section-icon" />
              <h3>{t('result.screeningSummary')}</h3>
            </div>

            <div className="summary-section-content">
              <div className="summary-field">
                <span className="summary-field-title">Primary Finding:</span>
                <span className="summary-field-value">{predData.primaryFinding || t(`severity.${drStageKey}`)}</span>
              </div>

              <div className="summary-field">
                <span className="summary-field-title">Additional Findings:</span>
                <span className="summary-field-value">{notableSecondary}</span>
              </div>

              <div className="summary-field highlight-step-field">
                <span className="summary-field-title">Recommended Next Step:</span>
                <span className="summary-field-value">
                  {predData.recommendedNextStep || t('result.defaultNextStep')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="result-actions-bar">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setIsReportModalOpen(true)}
              style={{ flex: 2 }}
            >
              <FileText size={20} />
              Generate Clinical Report
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={handleSaveResult}
              style={{ flex: 1 }}
              id="save-result-btn"
            >
              <Save size={18} />
              Save Result
            </button>
          </div>
        </div>
      </div>

      {/* Professional Medical Notice */}
      <div className="glass-card medical-notice-banner" id="result-medical-notice">
        <ShieldAlert size={18} className="notice-icon" />
        <span>{t('notice.medical')}</span>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        screeningData={{
          ...predData,
          screeningId,
          detectedFindings,
          findingsSummary: notableSecondary,
          primaryFinding: predData.primaryFinding || t(`severity.${drStageKey}`),
          recommendedNextStep: predData.recommendedNextStep || t('result.defaultNextStep')
        }}
        patientData={currentPatient}
        fundusImage={fundusImg}
        gradcamImage={heatmapImg}
      />

      {/* View Larger Image Modal */}
      {isLargeImageModalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsLargeImageModalOpen(false)}>
          <div className="modal-container glass-card large-img-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex-between">
              <h3>Retinal Fundus & Grad-CAM Attention Map</h3>
              <button className="btn btn-ghost btn-sm modal-close-btn" onClick={() => setIsLargeImageModalOpen(false)}>
                <ArrowLeft size={16} /> Close
              </button>
            </div>
            <div className="large-img-comparison">
              <div className="large-box">
                <span>Original Fundus Image</span>
                {fundusImg ? <img src={fundusImg} alt="Original large" /> : <div className="no-image-placeholder">No Image Available</div>}
              </div>
              <div className="large-box">
                <span>Grad-CAM Attention Heatmap</span>
                {heatmapImg ? <img src={heatmapImg} alt="Heatmap large" /> : <div className="no-image-placeholder">No Heatmap Available</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
