import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SeverityBadge from '../components/SeverityBadge';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  Stethoscope,
  ScanEye,
  Eye,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import './PatientProfilePage.css';

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, screenings, setSelectedPatient, t } = useApp();

  const patient = useMemo(() => {
    return patients.find(p => p.patientId === id) || patients[0];
  }, [patients, id]);

  // Screenings for this patient
  const patientScreenings = useMemo(() => {
    const matched = screenings.filter(s => s.patientId === patient?.patientId);
    if (matched.length >= 0) return matched;

    // Provide historical default if this is patient 1 or 2
    if (patient?.patientId === 'PAT-2026-001') {
      return [
        {
          screeningId: 'SCR-001',
          patientId: patient.patientId,
          screeningDate: '2026-09-08',
          drStage: 'stage2',
          drStageLabel: 'Stage 2 — Moderate',
          findingsSummary: 'AMD / ARMD: Possible finding, Glaucoma: Needs review',
          reportStatus: 'Finalized',
          reportId: 'REP-2026-001'
        }
      ];
    }

    if (patient?.patientId === 'PAT-2026-002') {
      return [
        {
          screeningId: 'SCR-002',
          patientId: patient.patientId,
          screeningDate: '2026-09-07',
          drStage: 'stage3',
          drStageLabel: 'Stage 3 — Severe',
          findingsSummary: 'BRVO: Possible finding',
          reportStatus: 'Finalized',
          reportId: 'REP-2026-002'
        }
      ];
    }

    return [];
  }, [screenings, patient]);

  const handleStartScreening = () => {
    setSelectedPatient(patient);
    navigate('/screening');
  };

  if (!patient) {
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate('/patients')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <div className="glass-card empty-state">
          <p>Patient profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="patient-profile-page">
      {/* Header */}
      <div className="page-header flex-between profile-header-row">
        <div>
          <button
            className="btn btn-ghost btn-sm back-btn"
            onClick={() => navigate('/patients')}
            id="profile-back-btn"
          >
            <ArrowLeft size={16} />
            Back to Patients
          </button>
          <h1 className="page-title">{patient.fullName}</h1>
          <p className="page-subtitle">Patient Medical Record & Ophthalmic History</p>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={handleStartScreening}
          id="profile-new-screening-btn"
        >
          <ScanEye size={20} />
          New Screening
        </button>
      </div>

      {/* Clinical Profile Card */}
      <div className="glass-card profile-details-card" id="patient-clinical-card">
        <div className="profile-hero-cluster">
          <div className="profile-large-avatar">
            <User size={36} />
          </div>
          <div className="profile-hero-info">
            <div className="hero-name-row">
              <h2 className="hero-name">{patient.fullName}</h2>
              <span className="profile-id-tag">{patient.patientId}</span>
              <span className={`diabetes-pill ${patient.diabetesStatus === 'Yes' ? 'diabetes-pill-yes' : 'diabetes-pill-no'}`}>
                Diabetes: {patient.diabetesStatus}
              </span>
            </div>
            <div className="hero-contact-row">
              <span>{patient.age} years old</span>
              <span>·</span>
              <span>{patient.gender}</span>
              <span>·</span>
              <span className="hero-flex-item"><Calendar size={13} /> DOB: {patient.dob}</span>
              <span>·</span>
              <span className="hero-flex-item"><Phone size={13} /> {patient.phone}</span>
              {patient.email && (
                <>
                  <span>·</span>
                  <span className="hero-flex-item"><Mail size={13} /> {patient.email}</span>
                </>
              )}
            </div>
            {patient.address && (
              <div className="hero-address-row">
                <MapPin size={13} />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clinical History Grid */}
        <div className="clinical-history-grid">
          <div className="clinical-box glass-card">
            <div className="clinical-box-header">
              <Activity size={16} className="clinical-icon" />
              <h4>Endocrine & Systemic</h4>
            </div>
            <div className="clinical-field">
              <span className="field-label">Diabetes Status:</span>
              <span className="field-val">{patient.diabetesStatus} ({patient.diabetesDuration || 'Duration unspecified'})</span>
            </div>
            <div className="clinical-field">
              <span className="field-label">Hypertension:</span>
              <span className="field-val">{patient.hypertension}</span>
            </div>
            <div className="clinical-field">
              <span className="field-label">Family History:</span>
              <span className="field-val">{patient.familyHistory || 'None noted'}</span>
            </div>
          </div>

          <div className="clinical-box glass-card">
            <div className="clinical-box-header">
              <Stethoscope size={16} className="clinical-icon" />
              <h4>Ophthalmic History</h4>
            </div>
            <div className="clinical-field">
              <span className="field-label">Previous Eye Disease:</span>
              <span className="field-val">{patient.previousEyeDisease || 'None'}</span>
            </div>
            <div className="clinical-field">
              <span className="field-label">Previous Eye Surgery:</span>
              <span className="field-val">{patient.previousEyeSurgery || 'None'}</span>
            </div>
            <div className="clinical-field">
              <span className="field-label">Current Medication:</span>
              <span className="field-val">{patient.currentMedication || 'None noted'}</span>
            </div>
          </div>

          <div className="clinical-box glass-card">
            <div className="clinical-box-header">
              <Clock size={16} className="clinical-icon" />
              <h4>Clinic Intake Info</h4>
            </div>
            <div className="clinical-field">
              <span className="field-label">Screening Location:</span>
              <span className="field-val">{patient.clinic || 'Community Eye Clinic'}</span>
            </div>
            <div className="clinical-field">
              <span className="field-label">Referring Doctor:</span>
              <span className="field-val">{patient.referringDoctor || 'Unassigned'}</span>
            </div>
            <div className="clinical-field">
              <span className="field-label">Clinical Notes:</span>
              <span className="field-val">{patient.notes || 'No extra notes recorded.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Screening History Section */}
      <div className="history-section">
        <div className="section-header-wrap flex-between">
          <div>
            <h2 className="section-title">Screening History</h2>
            <p className="section-subtitle">Chronological record of retinal fundus examinations</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleStartScreening}>
            <ScanEye size={15} />
            + New Examination
          </button>
        </div>

        <div className="screening-history-list stack stagger-children">
          {patientScreenings.length === 0 ? (
            <div className="glass-card empty-state">
              <Eye size={40} className="empty-icon" />
              <h3>{t('patient.noHistory')}</h3>
              <p>Perform the initial AI screening for this patient.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleStartScreening}
                style={{ marginTop: 12 }}
              >
                <ScanEye size={16} />
                Start Retinal Screening
              </button>
            </div>
          ) : (
            patientScreenings.map((screening) => {
              const thumbUrl = screening.imageUrl || screening.image_url;

              return (
                <div
                  key={screening.screeningId}
                  className="glass-card history-row-card"
                  onClick={() => navigate(`/result/${screening.screeningId}`)}
                  id={`history-${screening.screeningId}`}
                >
                  <div className="history-left-cluster">
                    <div className="history-thumb-box">
                      {thumbUrl ? <img src={thumbUrl} alt="Fundus eye thumbnail" className="history-thumb-img" /> : <Eye size={20} />}
                      <div className="eye-badge">
                        <Eye size={12} />
                      </div>
                    </div>

                    <div className="history-info-cluster">
                      <div className="history-title-line">
                        <span className="history-date">{screening.screeningDate}</span>
                        <span className="history-id-tag">{screening.screeningId}</span>
                      </div>
                      <div className="history-findings-line">
                        <Sparkles size={13} className="finding-icon" />
                        <span>{screening.findingsSummary || 'No significant secondary findings detected'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="history-right-cluster">
                    <SeverityBadge severity={screening.drStage} />
                    <span className="report-status-tag">
                      {screening.reportStatus || 'Finalized'}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/result/${screening.screeningId}`);
                      }}
                    >
                      <FileText size={15} />
                      View Report
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
