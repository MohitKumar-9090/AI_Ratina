import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User, MapPin, Phone, Hash, ArrowRight } from 'lucide-react';
import './PatientIntakePage.css';

export default function PatientIntakePage() {
  const { t, setCurrentPatient } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    village: '',
    patientId: '',
    phone: '',
  });

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const patientId = form.patientId || `PAT-${Date.now().toString(36).toUpperCase()}`;
    setCurrentPatient({ ...form, id: patientId });
    navigate('/screening/upload');
  };

  const isValid = form.name.trim() && form.age;

  return (
    <div className="page" id="intake-page">
      <div className="page-header">
        <h1 className="page-title">{t('intake.title')}</h1>
        <p className="page-subtitle">{t('intake.subtitle')}</p>
      </div>

      <form className="intake-form glass-card-static" onSubmit={handleSubmit} id="intake-form">
        <div className="form-group">
          <label className="form-label" htmlFor="patient-name">
            <User size={14} /> {t('intake.name')} *
          </label>
          <input
            type="text"
            id="patient-name"
            className="form-input"
            placeholder={t('intake.name')}
            value={form.name}
            onChange={handleChange('name')}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="patient-age">{t('intake.age')} *</label>
            <input
              type="number"
              id="patient-age"
              className="form-input"
              placeholder="45"
              min="1"
              max="120"
              value={form.age}
              onChange={handleChange('age')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="patient-gender">{t('intake.gender')}</label>
            <select
              id="patient-gender"
              className="form-select"
              value={form.gender}
              onChange={handleChange('gender')}
            >
              <option value="male">{t('intake.male')}</option>
              <option value="female">{t('intake.female')}</option>
              <option value="other">{t('intake.other')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="patient-village">
            <MapPin size={14} /> {t('intake.village')}
          </label>
          <input
            type="text"
            id="patient-village"
            className="form-input"
            placeholder={t('intake.village')}
            value={form.village}
            onChange={handleChange('village')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="patient-id">
              <Hash size={14} /> {t('intake.patientId')}
            </label>
            <input
              type="text"
              id="patient-id"
              className="form-input"
              placeholder="PAT-XXX"
              value={form.patientId}
              onChange={handleChange('patientId')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="patient-phone">
              <Phone size={14} /> {t('intake.phone')}
            </label>
            <input
              type="tel"
              id="patient-phone"
              className="form-input"
              placeholder="9876543210"
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg intake-submit"
          disabled={!isValid}
          id="intake-submit"
        >
          {t('intake.continue')}
          <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
}
