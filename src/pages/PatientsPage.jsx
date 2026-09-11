import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PatientFormModal from '../components/PatientFormModal';
import {
  Search,
  Plus,
  User,
  Phone,
  Activity,
  ArrowRight,
  ScanEye,
  Filter,
  Eye,
  ShieldAlert
} from 'lucide-react';
import './PatientsPage.css';

export default function PatientsPage() {
  const { patients, setSelectedPatient, t } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [diabetesFilter, setDiabetesFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.patientId || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.clinic || '').toLowerCase().includes(q);

      const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
      const matchesDiabetes = diabetesFilter === 'all' || p.diabetesStatus === diabetesFilter;

      return matchesSearch && matchesGender && matchesDiabetes;
    });
  }, [patients, search, genderFilter, diabetesFilter]);

  const handleStartScreening = (patient) => {
    setSelectedPatient(patient);
    navigate('/screening');
  };

  return (
    <div className="page" id="patients-page">
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">{t('patient.title')}</h1>
          <p className="page-subtitle">{t('patient.subtitle')}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          id="add-patient-btn"
        >
          <Plus size={18} />
          {t('patient.addNew')}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card-static patient-filter-bar">
        <div className="search-box-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder={t('patient.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="patients-search-input"
          />
        </div>

        <div className="filter-selects-wrap">
          <div className="filter-select-item">
            <Filter size={14} />
            <select
              className="form-select"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              id="filter-gender-select"
            >
              <option value="all">Gender: All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-select-item">
            <Activity size={14} />
            <select
              className="form-select"
              value={diabetesFilter}
              onChange={(e) => setDiabetesFilter(e.target.value)}
              id="filter-diabetes-select"
            >
              <option value="all">Diabetes: All</option>
              <option value="Yes">Diabetes: Yes</option>
              <option value="No">Diabetes: No</option>
              <option value="Unknown">Diabetes: Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Grid/List */}
      <div className="patients-grid stack stagger-children" id="patients-list">
        {filteredPatients.length === 0 ? (
          <div className="glass-card empty-state">
            <User size={44} className="empty-icon" />
            <h3>No patients found</h3>
            <p>Try adjusting your search criteria or register a new patient.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsModalOpen(true)}
              style={{ marginTop: 12 }}
            >
              <Plus size={16} />
              {t('patient.addNew')}
            </button>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div
              key={patient.patientId}
              className="glass-card patient-card"
              onClick={() => navigate(`/patients/${patient.patientId}`)}
              id={`patient-card-${patient.patientId}`}
            >
              <div className="patient-card-main">
                <div className="patient-avatar-badge">
                  <User size={22} />
                </div>

                <div className="patient-card-info">
                  <div className="patient-title-row">
                    <h3 className="patient-card-name">{patient.fullName}</h3>
                    <span className="patient-id-badge">{patient.patientId}</span>
                    <span className={`diabetes-pill ${patient.diabetesStatus === 'Yes' ? 'diabetes-pill-yes' : 'diabetes-pill-no'}`}>
                      Diabetes: {patient.diabetesStatus}
                    </span>
                  </div>

                  <div className="patient-card-meta">
                    <span>
                      {patient.age} yrs · {patient.gender}
                    </span>
                    <span className="meta-sep">·</span>
                    <span className="meta-flex">
                      <Phone size={12} /> {patient.phone || 'No phone'}
                    </span>
                    <span className="meta-sep">·</span>
                    <span>{patient.clinic || 'Community Clinic'}</span>
                  </div>
                </div>
              </div>

              <div className="patient-card-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patients/${patient.patientId}`);
                  }}
                >
                  <Eye size={15} />
                  View Profile
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartScreening(patient);
                  }}
                >
                  <ScanEye size={15} />
                  Screen Retina
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Professional Medical Safety Note */}
      <div className="medical-safety-note" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <ShieldAlert size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span>AI-generated screening results should be reviewed by a qualified eye-care professional.</span>
      </div>

      {/* New Patient Registration Modal */}
      <PatientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPatientSaved={(saved) => {
          setSelectedPatient(saved);
        }}
      />
    </div>
  );
}
