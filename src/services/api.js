import { getErrorMessage } from '../utils/errorUtils';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    // Only show "service unavailable" for genuine network failures (connection refused, DNS error).
    // Log the real error for debugging.
    console.error(`[Retina AI] Network error on ${path}:`, error);
    throw new Error('The Retina AI service is unavailable. Start the backend and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    // Extract the real error message from the backend response
    const serverMessage = body?.detail || body?.error?.message || body?.message;
    const fallback = `Request failed (${response.status}).`;
    let message;

    if (response.status === 422) {
      // Validation error — show specific field issues if available
      const fieldErrors = body?.error?.details;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        message = fieldErrors.map(e => e.message || e.field).join('; ');
      } else {
        message = serverMessage || 'Invalid request parameters.';
      }
    } else if (response.status === 503) {
      message = serverMessage || 'A required service is temporarily unavailable.';
    } else if (response.status >= 500) {
      message = serverMessage || 'An analysis error occurred on the server. Please try again.';
    } else {
      message = serverMessage || fallback;
    }

    const error = new Error(message);
    error.status = response.status;
    error.payload = body;
    throw error;
  }
  return body;
}

export async function checkBackendHealth() {
  try { return await request('/health'); } catch { return null; }
}

export const fetchPatients = () => request('/api/patients');
export const fetchPatientById = (patientId) => request(`/api/patients/${encodeURIComponent(patientId)}`);
export const createPatient = (patientData) => request('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patientData) });
export const fetchScreenings = () => request('/api/screenings');
export const fetchScreeningsByPatientId = (patientId) => request(`/api/screenings?patient_id=${encodeURIComponent(patientId)}`);
export const createScreening = (screeningData) => request('/api/screenings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(screeningData) });
export const fetchReports = () => request('/api/reports');
export const fetchReportById = (reportId) => request(`/api/reports/${encodeURIComponent(reportId)}`);
export const createReport = (screeningId, reportData) => request(`/api/reports/${encodeURIComponent(screeningId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportData) });

export async function predictFundusImage(image, patientId) {
  if (!(image instanceof File || image instanceof Blob)) throw new Error('Select a valid fundus image before analysis.');
  if (!patientId) throw new Error('Select a patient before analysis.');
  const formData = new FormData();
  formData.append('patient_id', patientId);
  formData.append('file', image, image.name || 'fundus.jpg');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const data = await request('/api/predict', { method: 'POST', body: formData, signal: controller.signal });

    // Validate the response contains the minimum required prediction data
    if (!data?.success || !data.dr) {
      throw new Error(getErrorMessage(data) || 'Unable to analyze retina. Please try again.');
    }

    const rfmidList = Array.isArray(data.rfmid_findings) ? data.rfmid_findings : (data.rfmidFindings || []);
    const odirList = Array.isArray(data.odir_findings) ? data.odir_findings : (data.odirFindings || []);

    // Combine AMD and ARMD into a single unified "AMD / ARMD" finding. Do not show AMD twice.
    const detectedSet = new Set();
    let hasAmd = false;

    [...rfmidList, ...odirList].forEach(f => {
      if (!f) return;
      const str = String(f).trim();
      const upper = str.toUpperCase();
      // ODIR "Normal" is a status label, NOT an additional disease finding. Suppress it.
      if (upper === 'NORMAL') {
        return;
      }
      if (upper === 'AMD' || upper === 'ARMD' || upper.includes('AMD') || upper.includes('ARMD')) {
        hasAmd = true;
      } else {
        detectedSet.add(str);
      }
    });

    const detectedFindings = [];
    if (hasAmd) {
      detectedFindings.push('AMD / ARMD');
    }
    detectedSet.forEach(f => detectedFindings.push(f));

    // Secondary findings structured array
    const secondaryFindings = detectedFindings.map(name => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: name,
      status: 'Detected',
      statusKey: 'detected'
    }));

    // Grad-CAM URL is optional — prediction is still valid without it
    const gradcamFullUrl = data.gradcam_url ? `${API_BASE_URL}${data.gradcam_url}` : null;
    const DR_DEFAULT_LABELS = {
      0: 'No DR',
      1: 'Mild DR',
      2: 'Moderate DR',
      3: 'Severe DR',
      4: 'Proliferative DR'
    };
    const drStageNum = data.drStage ?? data.dr_stage ?? data.dr?.stage ?? 0;
    const rawLabel = data.drLabel || data.dr_label || data.dr?.label || data.dr?.result || DR_DEFAULT_LABELS[drStageNum] || `Stage ${drStageNum}`;
    const cleanLabel = String(rawLabel).replace(/^Stage\s*\d+\s*[—–-]\s*/i, '');
    const drStageLabel = `Stage ${drStageNum} — ${cleanLabel}`;

    return {
      screeningId: data.screening_id || data.screeningId,
      screeningDate: data.created_at?.slice(0, 10),
      drStage: `stage${drStageNum}`,
      drStageNumber: drStageNum,
      dr_stage: drStageNum,
      dr_label: cleanLabel,
      drStageLabel: drStageLabel,
      drLabel: cleanLabel,
      primaryFinding: cleanLabel,
      rfmidFindings: rfmidList,
      odirFindings: odirList,
      detectedFindings: detectedFindings,
      secondaryFindings: secondaryFindings,
      imageUrl: `${API_BASE_URL}${data.image_url}`,
      heatmapDataUrl: gradcamFullUrl,
      explanation: 'Highlighted regions in the attention map contributed to the diabetic retinopathy classification.',
      recommendedNextStep: drStageNum >= 2
        ? 'Further evaluation by an eye-care professional is recommended.'
        : 'Routine annual eye examination is recommended.'
    };
  } finally { clearTimeout(timer); }
}
