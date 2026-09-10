import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SeverityBadge from '../components/SeverityBadge';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  ArrowRight,
  Sparkles,
  FileText,
  Plus
} from 'lucide-react';
import './PatientHistoryPage.css';

export default function PatientHistoryPage() {
  const { t, language, records } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const query = search.toLowerCase();
      const name = (language === 'hi' ? r.nameHi || r.name : r.name || '').toLowerCase();
      const id = (r.screeningId || r.id || '').toLowerCase();
      const secondary = (r.secondarySummary || '').toLowerCase();
      const date = (r.screeningDate || '').toLowerCase();

      const matchesSearch = !query || name.includes(query) || id.includes(query) || secondary.includes(query) || date.includes(query);

      let matchesStage = true;
      if (stageFilter !== 'all') {
        const raw = (r.drStage !== undefined && r.drStage !== null) ? String(r.drStage).toLowerCase().trim() : '';
        const norm = raw.startsWith('stage') ? raw : `stage${raw}`;
        matchesStage = norm === stageFilter;
      }

      return matchesSearch && matchesStage;
    });
  }, [records, search, stageFilter, language]);

  return (
    <div className="page" id="records-page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">{t('history.title')}</h1>
          <p className="page-subtitle">{t('history.subtitle')}</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/screening/upload')}
          id="records-new-screening-btn"
        >
          <Plus size={16} />
          {t('nav.newScreening')}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-card-static records-filter-bar" id="records-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder={t('history.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="records-search-input"
          />
        </div>

        <div className="filter-dropdowns">
          <div className="filter-item">
            <Filter size={14} />
            <select
              className="form-select filter-select"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              id="records-stage-filter"
            >
              <option value="all">{t('history.filterStage')}: {t('history.all')}</option>
              <option value="stage0">Stage 0 — No DR</option>
              <option value="stage1">Stage 1 — Mild</option>
              <option value="stage2">Stage 2 — Moderate</option>
              <option value="stage3">Stage 3 — Severe</option>
              <option value="stage4">Stage 4 — Proliferative DR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="records-list stack stagger-children" id="records-list">
        {filteredRecords.length === 0 ? (
          <div className="glass-card empty-state">
            <FileText size={44} className="empty-icon" />
            <h3>{t('history.noResults')}</h3>
            <p>Try adjusting your search criteria or create a new fundus screening.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/screening/upload')}
              style={{ marginTop: 12 }}
            >
              <Plus size={16} />
              {t('nav.newScreening')}
            </button>
          </div>
        ) : (
          filteredRecords.map(record => {
            const thumbUrl = record.imageUrl || record.image_url;

            return (
              <div
                key={record.screeningId || record.id}
                className="glass-card record-card"
                onClick={() => navigate(`/result/${record.screeningId}`)}
                id={`record-${record.screeningId || record.id}`}
              >
                <div className="record-main-cluster">
                  {/* Fundus Thumbnail */}
                  <div className="record-thumbnail-box">
                    {thumbUrl ? <img src={thumbUrl} alt="Fundus thumbnail" className="record-thumbnail-img" /> : <Eye size={20} />}
                    <div className="thumb-overlay-badge">
                      <Eye size={12} />
                    </div>
                  </div>

                  {/* Metadata and findings */}
                  <div className="record-info-cluster">
                    <div className="record-title-row">
                      <span className="record-id-badge">{record.screeningId}</span>
                      <span className="record-name">
                        {language === 'hi' ? record.nameHi || record.name : record.name}
                      </span>
                    </div>

                    <div className="record-findings-summary">
                      <Sparkles size={13} className="finding-summary-icon" />
                      <span>{record.secondarySummary || 'Screened for multi-disease retinal conditions'}</span>
                    </div>

                    <div className="record-sub-meta">
                      <span className="record-meta-item">
                        <Calendar size={12} />
                        {record.screeningDate}
                      </span>
                      <span className="record-meta-divider">·</span>
                      <span className="record-meta-status">{record.status}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: DR Stage and View Result */}
                <div className="record-right-cluster">
                  <SeverityBadge severity={record.drStage} />
                  <button
                    className="btn btn-ghost btn-sm record-view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/result/${record.screeningId}`);
                    }}
                  >
                    <span>{t('history.viewResult')}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
