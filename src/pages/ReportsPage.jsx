import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import SeverityBadge from '../components/SeverityBadge';
import ReportModal from '../components/ReportModal';
import { API_BASE_URL } from '../services/api';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Calendar,
  User
} from 'lucide-react';
import './ReportsPage.css';

export default function ReportsPage() {
  const { reports, patients, t } = useApp();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (r.patientName || '').toLowerCase().includes(q) ||
        (r.patientId || '').toLowerCase().includes(q) ||
        (r.reportId || '').toLowerCase().includes(q);

      const raw = (r.drStage !== undefined && r.drStage !== null) ? String(r.drStage).toLowerCase().trim() : '';
      const norm = raw.startsWith('stage') ? raw : `stage${raw}`;
      const matchesStage = stageFilter === 'all' || norm === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [reports, search, stageFilter]);

  const handleOpenModal = (report) => {
    const matchedPatient = patients.find(p => p.patientId === report.patientId);
    setSelectedReportForModal({
      report,
      patient: matchedPatient
    });
  };

  return (
    <div className="page" id="reports-page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">{t('report.title')}</h1>
          <p className="page-subtitle">{t('report.subtitle')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card-static reports-filter-bar">
        <div className="search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder={t('report.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="reports-search-input"
          />
        </div>

        <div className="filter-wrap">
          <Filter size={14} className="filter-icon" />
          <select
            className="form-select filter-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            id="reports-stage-filter"
          >
            <option value="all">{t('report.filterStage')}: All</option>
            <option value="stage0">Stage 0 — No DR</option>
            <option value="stage1">Stage 1 — Mild</option>
            <option value="stage2">Stage 2 — Moderate</option>
            <option value="stage3">Stage 3 — Severe</option>
            <option value="stage4">Stage 4 — Proliferative DR</option>
          </select>
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="reports-container glass-card-static">
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <FileText size={44} className="empty-icon" />
            <h3>No reports match your search criteria</h3>
            <p>Generate reports directly from the screening result page.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="reports-table" id="reports-table">
              <thead>
                <tr>
                  <th>{t('report.reportId')}</th>
                  <th>Patient</th>
                  <th>Patient ID</th>
                  <th>Date</th>
                  <th>DR Stage</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>{t('report.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.reportId} className="report-table-row">
                    <td>
                      <span className="report-id-code">{report.reportId}</span>
                    </td>
                    <td>
                      <div className="patient-name-cell">
                        <User size={14} className="user-icon-cell" />
                        <strong>{report.patientName}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="patient-id-tag">{report.patientId}</span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={13} />
                        <span>{report.screeningDate}</span>
                      </div>
                    </td>
                    <td>
                      <SeverityBadge severity={report.drStage} size="sm" />
                    </td>
                    <td>
                      <span className="table-status-pill pill-safe">
                        {report.status || 'Finalized'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-cell">
                        <button
                          className="btn btn-ghost btn-sm action-btn"
                          onClick={() => handleOpenModal(report)}
                          title="View Clinical Report"
                        >
                          <Eye size={14} />
                          <span>{t('report.view')}</span>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm action-btn"
                          onClick={() => handleOpenModal(report)}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm action-btn"
                          onClick={() => handleOpenModal(report)}
                          title="Print Report"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal Viewer */}
      {selectedReportForModal && (
        <ReportModal
          isOpen={!!selectedReportForModal}
          onClose={() => setSelectedReportForModal(null)}
          screeningData={selectedReportForModal.report}
          patientData={selectedReportForModal.patient}
          fundusImage={selectedReportForModal.report.imageUrl ? `${API_BASE_URL}${selectedReportForModal.report.imageUrl}` : null}
          gradcamImage={selectedReportForModal.report.gradcamUrl ? `${API_BASE_URL}${selectedReportForModal.report.gradcamUrl}` : null}
        />
      )}
    </div>
  );
}
