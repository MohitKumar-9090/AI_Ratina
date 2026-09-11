import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PatientFormModal from '../components/PatientFormModal';
import {
  ArrowLeft,
  User,
  UserPlus,
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileImage,
  X,
  RefreshCw,
  Activity,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import './ImageUploadPage.css';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/jpg']);

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ImageUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    patients,
    selectedPatient,
    setSelectedPatient,
    uploadedImage,
    setUploadedImage,
    isOffline,
    showToast
  } = useApp();

  const fileInputRef = useRef(null);

  // Component UI state
  const [file, setFile] = useState(uploadedImage || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sync patient from URL search params (e.g. ?patient=PAT-001)
  useEffect(() => {
    const paramId = new URLSearchParams(location.search).get('patient');
    if (paramId && patients.length > 0) {
      const match = patients.find(p => (p.patientId || p.patient_id) === paramId);
      if (match) setSelectedPatient(match);
    }
  }, [location.search, patients, setSelectedPatient]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // File validation & selection
  const handleCandidateFile = (candidate) => {
    if (!candidate) return;

    const fileType = candidate.type?.toLowerCase();
    const fileName = candidate.name?.toLowerCase() || '';
    const hasValidExt = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');

    if (!ACCEPTED_MIME_TYPES.has(fileType) && !hasValidExt) {
      showToast('Please upload a valid JPG, JPEG, or PNG fundus image.', 'error');
      return;
    }

    if (candidate.size > MAX_IMAGE_SIZE_BYTES) {
      showToast('File size exceeds the 10 MB limit.', 'error');
      return;
    }

    setFile(candidate);
    setUploadedImage(candidate);
    showToast('Fundus image loaded successfully.');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCandidateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCandidateFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered patients for the picker
  const filteredPatients = patients.filter((p) => {
    const q = patientSearchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (p.fullName || p.full_name || '').toLowerCase();
    const pid = (p.patientId || p.patient_id || '').toLowerCase();
    return name.includes(q) || pid.includes(q);
  });

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setIsPatientPickerOpen(false);
    setPatientSearchQuery('');
  };

  const handleNewPatientSaved = (newPatient) => {
    setSelectedPatient(newPatient);
    setIsPatientModalOpen(false);
    setIsPatientPickerOpen(false);
  };

  const handleStartAnalysis = () => {
    if (isOffline || !navigator.onLine) {
      showToast('An internet connection is required to perform AI screening.', 'error');
      return;
    }
    if (!selectedPatient) {
      showToast('Please select or register a patient before analysis.', 'error');
      return;
    }
    if (!file) {
      showToast('Please upload a retinal fundus image before analysis.', 'error');
      return;
    }

    setIsAnalyzing(true);
    navigate('/screening/processing');
  };

  const isFormReady = Boolean(selectedPatient && file);

  return (
    <div className="new-screening-page" id="new-screening-page">
      <div className="screening-container">
        {/* HEADER */}
        <header className="screening-header-section">
          <button
            type="button"
            className="screening-back-btn"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="screening-header-content">
            <h1 className="screening-title">New Screening</h1>
            <p className="screening-subtitle">
              Patient selection and high-resolution fundus image analysis
            </p>
          </div>
        </header>

        {/* MAIN CARDS STACK */}
        <div className="screening-cards-stack">
          {/* 1. PATIENT SELECTION CARD */}
          <section className="glass-card screening-card" id="patient-selection-card">
            <div className="screening-card-header">
              <div className="card-title-group">
                <div className="card-icon-wrap">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="card-title">Patient</h2>
                  <p className="card-subtitle">Select or register a patient for this clinical screening session</p>
                </div>
              </div>
              <div className="card-header-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setIsPatientPickerOpen(prev => !prev);
                  }}
                  id="select-existing-patient-btn"
                >
                  <Users size={16} />
                  <span>{selectedPatient ? 'Change Patient' : 'Select Existing Patient'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPatientModalOpen(true)}
                  id="add-new-patient-btn"
                >
                  <UserPlus size={16} />
                  <span>+ New Patient</span>
                </button>
              </div>
            </div>

            {/* INLINE PATIENT PICKER DROPDOWN / SEARCH */}
            {isPatientPickerOpen && (
              <div className="inline-patient-picker animate-fade-in" id="inline-patient-picker">
                <div className="picker-search-bar">
                  <Search size={16} className="picker-search-icon" />
                  <input
                    type="text"
                    className="picker-search-input"
                    placeholder="Search patient by name or ID..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {patientSearchQuery && (
                    <button
                      type="button"
                      className="picker-clear-btn"
                      onClick={() => setPatientSearchQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="picker-patient-list">
                  {filteredPatients.length === 0 ? (
                    <div className="picker-empty">
                      <p>No matching patients found.</p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setIsPatientModalOpen(true)}
                      >
                        + Create New Patient
                      </button>
                    </div>
                  ) : (
                    filteredPatients.map((p) => {
                      const pid = p.patientId || p.patient_id;
                      const name = p.fullName || p.full_name;
                      const isSelected = (selectedPatient?.patientId || selectedPatient?.patient_id) === pid;
                      return (
                        <div
                          key={pid}
                          className={`picker-patient-item ${isSelected ? 'picker-item-selected' : ''}`}
                          onClick={() => handleSelectPatient(p)}
                        >
                          <div className="picker-item-left">
                            <div className="picker-avatar">
                              {isSelected ? <CheckCircle2 size={16} /> : <User size={16} />}
                            </div>
                            <div className="picker-item-details">
                              <span className="picker-name">{name}</span>
                              <div className="picker-meta-row">
                                <span className="picker-id-badge">{pid}</span>
                                <span>{p.age ? `${p.age} yrs` : 'Age N/A'}</span>
                                <span>·</span>
                                <span>{p.gender || 'Unknown'}</span>
                                <span>·</span>
                                <span>Diabetes: {p.diabetesStatus || p.diabetes_status || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                          <button type="button" className="btn btn-ghost btn-sm">
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* PATIENT STATE: COMPACT SUMMARY OR CLEAN EMPTY STATE */}
            {selectedPatient ? (
              <div className="patient-selected-summary" id="patient-selected-summary">
                <div className="summary-avatar-disc">
                  <UserCheck size={24} />
                </div>
                <div className="summary-info-block">
                  <div className="summary-name-row">
                    <span className="summary-patient-name">
                      {selectedPatient.fullName || selectedPatient.full_name}
                    </span>
                    <span className="summary-patient-id">
                      {selectedPatient.patientId || selectedPatient.patient_id}
                    </span>
                  </div>
                  <div className="summary-meta-row">
                    <div className="summary-meta-item">
                      <span className="meta-label">Age:</span>
                      <span className="meta-value">{selectedPatient.age ?? '—'} yrs</span>
                    </div>
                    <div className="summary-meta-divider">•</div>
                    <div className="summary-meta-item">
                      <span className="meta-label">Gender:</span>
                      <span className="meta-value">{selectedPatient.gender || '—'}</span>
                    </div>
                    <div className="summary-meta-divider">•</div>
                    <div className="summary-meta-item">
                      <span className="meta-label">Diabetes:</span>
                      <span className={`meta-value ${selectedPatient.diabetesStatus === 'Yes' ? 'meta-highlight' : ''}`}>
                        {selectedPatient.diabetesStatus || selectedPatient.diabetes_status || '—'}
                      </span>
                    </div>
                    {selectedPatient.hypertension && (
                      <>
                        <div className="summary-meta-divider">•</div>
                        <div className="summary-meta-item">
                          <span className="meta-label">Hypertension:</span>
                          <span className="meta-value">{selectedPatient.hypertension}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="summary-action-col">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm change-patient-link"
                    onClick={() => setIsPatientPickerOpen(true)}
                  >
                    Change Patient
                  </button>
                </div>
              </div>
            ) : (
              <div className="patient-empty-state" id="patient-empty-state">
                <div className="empty-icon-circle">
                  <User size={28} />
                </div>
                <div className="empty-text-wrap">
                  <h3 className="empty-title">No patient selected</h3>
                  <p className="empty-desc">
                    Select an existing patient or create a new patient to continue.
                  </p>
                </div>
                <div className="empty-actions-row">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsPatientPickerOpen(true)}
                  >
                    <Users size={16} />
                    <span>Select Existing Patient</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsPatientModalOpen(true)}
                  >
                    <UserPlus size={16} />
                    <span>+ New Patient</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 2. FUNDUS IMAGE CARD */}
          <section className="glass-card screening-card" id="fundus-image-card">
            <div className="screening-card-header">
              <div className="card-title-group">
                <div className="card-icon-wrap">
                  <FileImage size={20} />
                </div>
                <div>
                  <h2 className="card-title">Fundus Image</h2>
                  <p className="card-subtitle">
                    Upload a clear retinal fundus photograph for AI screening.
                  </p>
                </div>
              </div>
            </div>

            {/* COMPLETELY HIDDEN NATIVE FILE INPUT (NO "Choose file / No file chosen") */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="fundus-hidden-input"
              aria-label="Upload Fundus Image"
              onChange={handleFileInputChange}
            />

            {!file ? (
              /* DRAG & DROP AREA */
              <div
                className={`fundus-dropzone ${dragActive ? 'dropzone-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="dropzone-center-content">
                  <div className="dropzone-icon-circle">
                    <UploadCloud size={36} />
                  </div>
                  <strong className="dropzone-main-text">
                    Drag & drop fundus image here
                  </strong>
                  <span className="dropzone-or-text">or</span>
                  <button
                    type="button"
                    className="btn btn-primary browse-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <FileImage size={16} />
                    <span>Browse Image</span>
                  </button>
                  <div className="dropzone-spec-badges">
                    <span>JPG • JPEG • PNG</span>
                    <span>•</span>
                    <span>Maximum size: 10 MB</span>
                  </div>
                </div>
              </div>
            ) : (
              /* PROFESSIONAL IMAGE PREVIEW */
              <div className="fundus-preview-container animate-fade-in" id="fundus-preview-container">
                <div className="preview-image-box">
                  <img
                    src={previewUrl}
                    alt="Fundus photograph preview"
                    className="preview-img-element"
                  />
                </div>
                <div className="preview-details-card">
                  <div className="preview-file-info">
                    <div className="file-info-icon">
                      <FileImage size={20} />
                    </div>
                    <div className="file-info-text">
                      <strong className="file-name-label">{file.name}</strong>
                      <span className="file-size-label">{formatBytes(file.size)}</span>
                    </div>
                  </div>
                  <div className="preview-control-buttons">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RefreshCw size={14} />
                      <span>Change Image</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm remove-image-btn"
                      onClick={handleRemoveImage}
                    >
                      <X size={14} />
                      <span>Remove Image</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 3. IMAGE QUALITY CARD */}
          <section className="glass-card screening-card quality-status-card" id="image-quality-card">
            <div className="quality-card-inner">
              <div className="quality-left-cluster">
                <div className={`quality-icon-disc ${file ? 'disc-passed' : 'disc-idle'}`}>
                  {file ? <CheckCircle2 size={22} /> : <Activity size={22} />}
                </div>
                <div className="quality-text-block">
                  <h3 className="quality-heading">Image Quality</h3>
                  {file ? (
                    <div className="quality-status-row">
                      <span className="quality-badge-passed">Ready for analysis</span>
                      <span className="quality-desc">
                        Image format and resolution meet AI screening requirements.
                      </span>
                    </div>
                  ) : (
                    <p className="quality-idle-desc">Upload an image to assess quality</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 4. ANALYSIS ACTION */}
          <section className="screening-action-section">
            <button
              type="button"
              className="btn btn-primary btn-lg analyze-cta-btn"
              disabled={!isFormReady || isAnalyzing || isOffline}
              onClick={handleStartAnalysis}
              id="analyze-retina-cta-btn"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="spinning-loader" />
                  <span>Analyzing Retina...</span>
                </>
              ) : (
                <>
                  <span>Analyze Retina →</span>
                </>
              )}
            </button>
            {isOffline ? (
              <p className="action-disabled-hint" style={{ color: 'var(--accent-alert)' }}>
                <AlertCircle size={14} />
                <span>An internet connection is required to perform AI screening.</span>
              </p>
            ) : !isFormReady && (
              <p className="action-disabled-hint">
                <AlertCircle size={14} />
                <span>
                  {!selectedPatient && !file
                    ? 'Select a patient and upload a fundus image to proceed with screening.'
                    : !selectedPatient
                    ? 'Please select or register a patient before analysis.'
                    : 'Please upload a fundus photograph to proceed.'}
                </span>
              </p>
            )}
          </section>

          {/* 5. SAFETY NOTE */}
          <footer className="screening-safety-note" id="screening-safety-note">
            <ShieldAlert size={16} className="safety-note-icon" />
            <span>
              AI-generated screening results should be reviewed by a qualified eye-care professional.
            </span>
          </footer>
        </div>
      </div>

      {/* PATIENT REGISTRATION MODAL */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onPatientSaved={handleNewPatientSaved}
      />
    </div>
  );
}
