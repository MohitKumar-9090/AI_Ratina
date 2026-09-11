import { getErrorMessage } from '../utils/errorUtils';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://retina-ai-d81m.onrender.com' : 'http://127.0.0.1:8000')
).replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error?.name === 'AbortError') {
      const err = new Error('The request timed out. The server may still be warming up or processing. Please try again.');
      err.errorType = 'TIMEOUT';
      throw err;
    }
    console.error(`[Retina AI] Network error on ${path}:`, error);
    const err = new Error('Cannot reach the Retina AI backend. If the service was idle, Render cold start may take up to 90 seconds. Please try again.');
    err.errorType = 'NETWORK_ERROR';
    throw err;
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const serverMessage = body?.detail || body?.error?.message || body?.message;
    const fallback = `Request failed (${response.status}).`;
    let message;
    let errorType = response.status >= 500 ? 'BACKEND_5XX' : 'BACKEND_4XX';

    if (response.status === 422) {
      const fieldErrors = body?.error?.details;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        message = fieldErrors.map(e => e.message || e.field).join('; ');
      } else {
        message = serverMessage || 'Invalid request parameters.';
      }
    } else if (response.status === 502) {
      message = 'The backend service temporarily restarted or is warming up (Bad Gateway). Please retry.';
      errorType = 'BACKEND_5XX';
    } else if (response.status === 503) {
      message = serverMessage || 'A required service (e.g. database) is temporarily unavailable.';
      errorType = 'BACKEND_5XX';
    } else if (response.status >= 500) {
      message = serverMessage || 'An internal analysis error occurred on the server. Please try again.';
      errorType = 'BACKEND_5XX';
    } else {
      message = serverMessage || fallback;
    }

    const error = new Error(message);
    error.status = response.status;
    error.errorType = errorType;
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

    // Grad-CAM and Image URLs normalization (handle relative and absolute URLs)
    const resolveUrl = (url) => {
      if (!url) return null;
      if (typeof url !== 'string') return null;
      return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const gradcamFullUrl = resolveUrl(data.gradcam_url || data.gradcamUrl);
    const imageFullUrl = resolveUrl(data.image_url || data.imageUrl);

    const DR_DEFAULT_LABELS = {
      0: 'No DR',
      1: 'Mild DR',
      2: 'Moderate DR',
      3: 'Severe DR',
      4: 'Proliferative DR'
    };

    const parseStage = (val) => {
      if (val === undefined || val === null) return null;
      if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.min(4, Math.floor(val)));
      const cleaned = String(val).toLowerCase().replace(/[^0-9]/g, '');
      const parsed = parseInt(cleaned, 10);
      return !isNaN(parsed) ? Math.max(0, Math.min(4, parsed)) : null;
    };

    const drStageNum = parseStage(data.drStage) ?? parseStage(data.dr_stage) ?? parseStage(data.dr?.stage) ?? 0;
    let cleanLabel = DR_DEFAULT_LABELS[drStageNum];
    const rawLabel = data.drLabel || data.dr_label || data.dr?.label || data.dr?.result;
    if (rawLabel) {
      const stripped = String(rawLabel).replace(/^Stage\s*\d+\s*[—–-]\s*/i, '').trim();
      if (stripped.toLowerCase() === 'severe') cleanLabel = 'Severe DR';
      else if (stripped.toLowerCase() === 'mild') cleanLabel = 'Mild DR';
      else if (stripped.toLowerCase() === 'moderate') cleanLabel = 'Moderate DR';
      else if (stripped.toLowerCase() === 'proliferative') cleanLabel = 'Proliferative DR';
      else if (stripped.toLowerCase() === 'no dr' || stripped.toLowerCase() === 'no') cleanLabel = 'No DR';
      else if (stripped) cleanLabel = stripped;
    }
    const drStageLabel = `Stage ${drStageNum} — ${cleanLabel}`;
    const screeningId = data.screening_id || data.screeningId;

    return {
      screeningId: screeningId,
      screening_id: screeningId,
      screeningDate: data.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
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
      imageUrl: imageFullUrl,
      image_url: imageFullUrl,
      heatmapDataUrl: gradcamFullUrl,
      gradcamUrl: gradcamFullUrl,
      gradcam_url: gradcamFullUrl,
      explanation: 'Highlighted regions in the attention map contributed to the diabetic retinopathy classification.',
      recommendedNextStep: drStageNum >= 2
        ? 'Further evaluation by an eye-care professional is recommended.'
        : 'Routine annual eye examination is recommended.'
    };
  } finally { clearTimeout(timer); }
}
