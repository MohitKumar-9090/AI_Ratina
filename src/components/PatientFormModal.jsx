import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  Stethoscope,
  FileText,
  Check,
  Hash
} from 'lucide-react';
import './PatientFormModal.css';

function calculateAge(dobString) {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
}

export default function PatientFormModal({ isOpen, onClose, onPatientSaved }) {
  const { addPatient, t } = useApp();

  const [formData, setFormData] = useState(() => ({
    patientId: '',
    fullName: '',
    dob: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    diabetesStatus: 'Yes',
    diabetesDuration: '',
    hypertension: 'No',
    previousEyeDisease: 'None',
    previousEyeSurgery: 'None',
    currentMedication: '',
    familyHistory: 'None',
    clinic: 'Apex Community Eye Clinic',
    referringDoctor: '',
    notes: '',
    screeningDate: new Date().toISOString().split('T')[0]
  }));

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dob') {
      const computedAge = calculateAge(value);
      setFormData(prev => ({ ...prev, dob: value, age: computedAge }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    const saved = await addPatient(formData);
    if (onPatientSaved) {
      onPatientSaved(saved);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <User size={20} />
            </div>
            <div>
              <h2 className="modal-title">{t('patient.addNew')}</h2>
              <p className="modal-subtitle">Register new patient and clinical ophthalmic history</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          {/* SECTION 1: Patient Information */}
          <div className="form-section">
            <div className="section-badge-title">
              <User size={15} />
              <span>Patient Information</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="patientId">
                  <Hash size={13} /> {t('patient.patientId')} *
                </label>
                <input
                  type="text"
                  id="patientId"
                  name="patientId"
                  className="form-input"
                  value={formData.patientId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label" htmlFor="fullName">
                  <User size={13} /> {t('patient.fullName')} *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="e.g. Ramesh Kumar"
                  className="form-input"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="dob">
                  <Calendar size={13} /> {t('patient.dob')} *
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  className="form-input"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="age">
                  {t('patient.age')} (Auto)
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  placeholder="Age"
                  className="form-input"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">
                  {t('patient.gender')}
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  <Phone size={13} /> {t('patient.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="+91 98765 43210"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <Mail size={13} /> {t('patient.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="patient@example.com"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                <MapPin size={13} /> {t('patient.address')}
              </label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Residential Address / Village / City"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SECTION 2: Medical Information */}
          <div className="form-section">
            <div className="section-badge-title">
              <Activity size={15} />
              <span>Medical Information</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="diabetesStatus">
                  {t('patient.diabetesStatus')}
                </label>
                <select
                  id="diabetesStatus"
                  name="diabetesStatus"
                  className="form-select"
                  value={formData.diabetesStatus}
                  onChange={handleChange}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="diabetesDuration">
                  {t('patient.diabetesDuration')}
                </label>
                <input
                  type="text"
                  id="diabetesDuration"
                  name="diabetesDuration"
                  placeholder="e.g. 6 years"
                  className="form-input"
                  value={formData.diabetesDuration}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="hypertension">
                  {t('patient.hypertension')}
                </label>
                <select
                  id="hypertension"
                  name="hypertension"
                  className="form-select"
                  value={formData.hypertension}
                  onChange={handleChange}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="previousEyeDisease">
                  {t('patient.previousEyeDisease')}
                </label>
                <input
                  type="text"
                  id="previousEyeDisease"
                  name="previousEyeDisease"
                  placeholder="e.g. Cataract, Glaucoma, None"
                  className="form-input"
                  value={formData.previousEyeDisease}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="previousEyeSurgery">
                  {t('patient.previousEyeSurgery')}
                </label>
                <input
                  type="text"
                  id="previousEyeSurgery"
                  name="previousEyeSurgery"
                  placeholder="e.g. Cataract Surgery (2023), None"
                  className="form-input"
                  value={formData.previousEyeSurgery}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="currentMedication">
                  {t('patient.currentMedication')}
                </label>
                <input
                  type="text"
                  id="currentMedication"
                  name="currentMedication"
                  placeholder="e.g. Metformin, Eye drops"
                  className="form-input"
                  value={formData.currentMedication}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="familyHistory">
                  {t('patient.familyHistory')}
                </label>
                <input
                  type="text"
                  id="familyHistory"
                  name="familyHistory"
                  placeholder="e.g. Parent had diabetic eye disease"
                  className="form-input"
                  value={formData.familyHistory}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Screening Intake Information */}
          <div className="form-section">
            <div className="section-badge-title">
              <Stethoscope size={15} />
              <span>Screening Information</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="screeningDate">
                  {t('patient.screeningDate')}
                </label>
                <input
                  type="date"
                  id="screeningDate"
                  name="screeningDate"
                  className="form-input"
                  value={formData.screeningDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label" htmlFor="clinic">
                  {t('patient.clinic')}
                </label>
                <input
                  type="text"
                  id="clinic"
                  name="clinic"
                  placeholder="Clinic / Health Center"
                  className="form-input"
                  value={formData.clinic}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="referringDoctor">
                {t('patient.referringDoctor')}
              </label>
              <input
                type="text"
                id="referringDoctor"
                name="referringDoctor"
                placeholder="Dr. Name / Optometrist"
                className="form-input"
                value={formData.referringDoctor}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                <FileText size={13} /> {t('patient.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="2"
                placeholder="Additional clinical symptoms or history notes..."
                className="form-input form-textarea"
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-bar">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('patient.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" id="save-patient-submit-btn">
              <Check size={18} />
              {t('patient.savePatient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
