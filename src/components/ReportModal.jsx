import { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  X,
  ArrowDownToLine,
  Printer,
  Save,
  FileText,
  Eye
} from 'lucide-react';
import './ReportModal.css';

export default function ReportModal({
  isOpen,
  onClose,
  screeningData,
  patientData,
  fundusImage,
  gradcamImage,
  autoDownload = false
}) {
  const { saveReport, showToast } = useApp();
  const reportContentRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reportId] = useState(() => screeningData?.reportId || 'Pending');
  const autoDownloadedRef = useRef(false);

  const patient = patientData || { fullName: 'Not available', patientId: 'Not available' };

  const dateStr = screeningData?.screeningDate || new Date().toISOString().split('T')[0];
  const clinicName = typeof localStorage !== 'undefined' ? localStorage.getItem('retina_clinic_name') || 'AI Retina Tele-Ophthalmology Centre' : 'AI Retina Tele-Ophthalmology Centre';
  const doctorName = typeof localStorage !== 'undefined' ? localStorage.getItem('retina_doctor_name') || 'Dr. S. Mehta, MS (Ophthalmology)' : 'Dr. S. Mehta, MS (Ophthalmology)';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportContentRef.current) return;
    setIsGeneratingPdf(true);
    showToast('Generating clinical PDF report...');

    try {
      const element = reportContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RetinaAI_Report_${patient.patientId}_${reportId}.pdf`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to generate PDF. You can use the Print option.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (isOpen && autoDownload && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownload]);

  const parseStageVal = (val) => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.min(4, Math.floor(val)));
    const cleaned = String(val).toLowerCase().replace(/[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    return !isNaN(parsed) ? Math.max(0, Math.min(4, parsed)) : null;
  };
  const stageNum = parseStageVal(screeningData.drStageNumber) ?? parseStageVal(screeningData.dr_stage) ?? parseStageVal(screeningData.drStage) ?? 0;

  const stageNames = { 0: 'No DR', 1: 'Mild DR', 2: 'Moderate DR', 3: 'Severe DR', 4: 'Proliferative DR' };
  const resolvedStageLabel = screeningData.drStageLabel || `Stage ${stageNum} — ${stageNames[stageNum] || 'No DR'}`;

  const handleSaveReport = async () => {
    await saveReport({
      reportId,
      screeningId: screeningData.screeningId || 'SCR-001',
      patientId: patient.patientId,
      patientName: patient.fullName,
      screeningDate: dateStr,
      drStage: screeningData.drStage || `stage${stageNum}`,
      drStageLabel: resolvedStageLabel,
      status: 'Finalized',
      secondaryFindingsSummary: screeningData.findingsSummary || 'Screened for multi-disease retinal conditions',
      primaryFinding: screeningData.primaryFinding || resolvedStageLabel,
      recommendedNextStep: screeningData.recommendedNextStep || 'Further evaluation by an eye-care professional is recommended.'
    });
    setIsSaved(true);
  };

  const detectedFindings = screeningData?.detectedFindings || [];

  if (!isOpen || !screeningData) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="report-modal-container glass-card" onClick={e => e.stopPropagation()}>
        {/* Modal Top Control Bar */}
        <div className="report-modal-header flex-between">
          <div className="report-modal-title-wrap">
            <FileText size={20} className="report-header-icon" />
            <div>
              <h3>Official Retinal Screening Report</h3>
              <span className="report-modal-sub">Document ID: {reportId}</span>
            </div>
          </div>

          <div className="report-modal-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleSaveReport}
              disabled={isSaved}
              id="save-report-btn"
            >
              <Save size={15} />
              {isSaved ? 'Saved to Archive' : 'Save Report'}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handlePrint}
              id="print-report-btn"
            >
              <Printer size={15} />
              Print Report
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              id="download-pdf-btn"
              aria-label="Download Clinical Report PDF"
              title="Download Clinical Report as PDF"
            >
              <ArrowDownToLine size={15} />
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>

            <button className="btn btn-ghost btn-sm modal-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable / Renderable Clinical Report Sheet */}
        <div className="report-sheet-scroll">
          <div className="report-sheet-paper" ref={reportContentRef} id="clinical-report-sheet">
            {/* 1. OFFICIAL HEADER */}
            <div className="report-sheet-header">
              <div className="report-brand">
                <div className="brand-logo-mark">
                  <Eye size={24} />
                </div>
                <div>
                  <h1 className="report-brand-title">RETINA AI</h1>
                  <span className="report-brand-sub">{clinicName.toUpperCase()}</span>
                </div>
              </div>
              <div className="report-doc-meta">
                <h2 className="report-main-title">RETINAL SCREENING REPORT</h2>
                <div className="doc-meta-row">
                  <span><strong>Report ID:</strong> {reportId}</span>
                  <span><strong>Date:</strong> {dateStr}</span>
                </div>
              </div>
            </div>

            <div className="report-divider"></div>

            {/* 2. PATIENT INFORMATION */}
            <div className="report-section-block">
              <h3 className="section-title-tag">PATIENT INFORMATION</h3>
              <div className="report-info-grid">
                <div className="info-cell">
                  <span className="cell-label">Patient ID</span>
                  <span className="cell-value">{patient.patientId}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Patient Name</span>
                  <span className="cell-value">{patient.fullName}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Date of Birth</span>
                  <span className="cell-value">{patient.dob || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Age / Gender</span>
                  <span className="cell-value">{patient.age} yrs / {patient.gender}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Phone Number</span>
                  <span className="cell-value">{patient.phone || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Screening Date</span>
                  <span className="cell-value">{dateStr}</span>
                </div>
              </div>
            </div>

            {/* 3. CLINICAL INFORMATION */}
            <div className="report-section-block">
              <h3 className="section-title-tag">CLINICAL INFORMATION</h3>
              <div className="report-info-grid">
                <div className="info-cell">
                  <span className="cell-label">Diabetes Status</span>
                  <span className="cell-value">{patient.diabetesStatus || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Diabetes Duration</span>
                  <span className="cell-value">{patient.diabetesDuration || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Hypertension</span>
                  <span className="cell-value">{patient.hypertension || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Previous Eye Disease</span>
                  <span className="cell-value">{patient.previousEyeDisease || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Previous Eye Surgery</span>
                  <span className="cell-value">{patient.previousEyeSurgery || 'Not recorded'}</span>
                </div>
                <div className="info-cell">
                  <span className="cell-label">Current Medication</span>
                  <span className="cell-value">{patient.currentMedication || 'Not recorded'}</span>
                </div>
              </div>
              {patient.notes && (
                <div className="report-notes-box">
                  <strong>Additional Notes:</strong> {patient.notes}
                </div>
              )}
            </div>

            {/* 4. RETINAL IMAGE & GRAD-CAM EXPLANATION */}
            <div className="report-section-block">
              <h3 className="section-title-tag">RETINAL IMAGING & AI ATTENTION ANALYSIS</h3>
              <div className="report-images-row">
                <div className="report-image-box">
                  <span className="image-caption">RETINAL IMAGE (ORIGINAL FUNDUS)</span>
                  <div className="image-frame">
                    <img src={fundusImage} alt="Original Retinal Fundus" />
                  </div>
                </div>
                <div className="report-image-box">
                  <span className="image-caption">AI EXPLANATION (GRAD-CAM ATTENTION MAP)</span>
                  <div className="image-frame">
                    <img src={gradcamImage} alt="Grad-CAM Attention Map" />
                  </div>
                </div>
              </div>
              <p className="image-desc-note">
                * Highlighted Grad-CAM attention regions indicate areas that contributed to the model&apos;s screening result.
              </p>
            </div>

            {/* 5. AI SCREENING RESULT */}
            <div className="report-section-block">
              <h3 className="section-title-tag">AI SCREENING RESULT</h3>
              <div className="dr-result-banner">
                <div className="dr-result-main">
                  <span className="dr-stage-tag">{resolvedStageLabel}</span>
                  <span className="dr-subtitle">Primary Target: Diabetic Retinopathy Classification</span>
                </div>
                <div className="model-id-pill">Retina AI Deep Learning System</div>
              </div>

              {/* 6. ADDITIONAL FINDINGS TABLE */}
              <div className="additional-findings-table-wrap">
                <h4 className="sub-table-title">ADDITIONAL RETINAL FINDINGS</h4>
                {detectedFindings.length > 0 ? (
                  <table className="report-findings-table">
                    <thead>
                      <tr>
                        <th>Condition Screened</th>
                        <th>Finding Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detectedFindings.map((finding, i) => (
                        <tr key={i}>
                          <td><strong>{finding}</strong></td>
                          <td>
                            <span className="table-status-pill pill-warn">
                              Detected
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="report-no-findings-box" style={{ padding: '12px 16px', background: 'rgba(6, 214, 160, 0.08)', borderRadius: '6px', color: '#06d6a0', fontWeight: 600, fontSize: '0.875rem' }}>
                    ✓ No additional findings detected
                  </div>
                )}
              </div>
            </div>

            {/* 7. SCREENING SUMMARY */}
            <div className="report-section-block summary-block">
              <h3 className="section-title-tag">SCREENING SUMMARY</h3>
              <div className="summary-list">
                <div className="summary-item">
                  <span className="summary-label">Primary Finding:</span>
                  <span className="summary-val">{screeningData.primaryFinding || screeningData.drStageLabel}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Additional Findings:</span>
                  <span className="summary-val">{screeningData.findingsSummary || (detectedFindings.length > 0 ? detectedFindings.join(', ') : 'No additional findings detected')}</span>
                </div>
                <div className="summary-item highlight-next-step">
                  <span className="summary-label">Suggested Follow-up:</span>
                  <span className="summary-val">
                    {screeningData.recommendedNextStep || 'Further evaluation by an eye-care professional is recommended.'}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. CLINICAL SIGN-OFF & PROFESSIONAL NOTICE */}
            <div className="report-footer-block">
              <div className="report-disclaimer-text">
                <strong>Professional Medical Notice:</strong> AI-generated screening results are intended to support clinical review and should be interpreted by a qualified eye-care professional.
              </div>
              <div className="signature-cluster">
                <div className="sig-line">
                  <span className="sig-label">Reviewed By:</span>
                  <div className="sig-doctor-name">{doctorName}</div>
                  <div className="sig-placeholder">_______________________________ (Signature)</div>
                </div>
                <div className="sig-date">
                  <span className="sig-label">Date:</span>
                  <div className="sig-placeholder">{dateStr}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
