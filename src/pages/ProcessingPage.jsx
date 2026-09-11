import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, ShieldCheck, Sparkles, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { predictFundusImage } from '../services/api';
import { getErrorMessage } from '../utils/errorUtils';
import './ProcessingPage.css';

export default function ProcessingPage() {
  const {
    t,
    uploadedImage,
    selectedPatient,
    setLatestResult,
    showToast
  } = useApp();

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const isRequestInProgressRef = useRef(false);

  const steps = [
    t('processing.step1') || 'Image received',
    t('processing.step2') || 'Retinal image processed',
    t('processing.step3') || 'Diabetic retinopathy analysis',
    t('processing.step4') || 'Additional retinal findings',
    t('processing.step5') || 'AI attention analysis',
    t('processing.step6') || 'Report preparation',
  ];

  const handleRetry = useCallback(() => {
    isRequestInProgressRef.current = false;
    setError(null);
    setCurrentStep(0);
    setProgress(0);
    setRetryKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const targetPatientId = selectedPatient?.patientId || selectedPatient?.patient_id;
    if (!uploadedImage || !targetPatientId) {
      showToast('Select a patient and fundus image before analysis.', 'error');
      navigate('/screening');
      return undefined;
    }

    if (!navigator.onLine) {
      setError({
        title: 'Connection Offline',
        message: 'An internet connection is required to perform AI screening. Please connect to the internet and try again.'
      });
      return undefined;
    }

    if (isRequestInProgressRef.current) {
      return undefined;
    }
    isRequestInProgressRef.current = true;

    const totalDuration = 3600; // smooth animation
    const stepDuration = totalDuration / steps.length;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98;
        return prev + 2;
      });
    }, totalDuration / 50);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, stepDuration);

    predictFundusImage(uploadedImage, targetPatientId)
      .then(result => {
        if (isCancelled) return;
        setProgress(100);
        setCurrentStep(steps.length);

        const finalScreeningId = result.screeningId || result.screening_id;
        const patientName = selectedPatient?.fullName || selectedPatient?.full_name || 'Patient';

        setLatestResult({
          ...result,
          screeningId: finalScreeningId,
          screening_id: finalScreeningId,
          patientId: targetPatientId,
          patient_id: targetPatientId,
          patientName
        });

        setTimeout(() => {
          navigate(`/result/${finalScreeningId}`);
        }, 400);
      })
      .catch(err => {
        if (isCancelled) return;
        const msg = getErrorMessage(err);
        console.error('Inference error:', err);
        setError(msg);
        showToast(msg, 'error');
      })
      .finally(() => {
        isRequestInProgressRef.current = false;
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      });

    return () => {
      isCancelled = true;
      isRequestInProgressRef.current = false;
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [navigate, steps.length, uploadedImage, selectedPatient, setLatestResult, showToast, retryKey]);

  return (
    <div className="processing-page" id="processing-page">
      <div className="processing-content animate-fade-in">
        {/* Pulsing retina scanner animation */}
        <div className="processing-icon-wrapper">
          <div className="processing-ring processing-ring-1"></div>
          <div className="processing-ring processing-ring-2"></div>
          <div className="processing-ring processing-ring-3"></div>
          <div className="processing-icon">
            <Eye size={42} strokeWidth={2.2} />
          </div>
        </div>

        <div className="processing-header-wrap">
          <h2 className="processing-title">{t('processing.analyzing')}</h2>
          <div className="processing-model-tag">
            <Sparkles size={14} />
            <span>EfficientNet-B0 Multitask Model</span>
          </div>
        </div>

        {error ? (
          <div className="processing-error-box animate-fade-in" id="processing-error-box">
            <div className="processing-error-icon">
              <AlertCircle size={36} color="var(--accent-danger, #e63946)" />
            </div>
            <h3 className="processing-error-title">Analysis Incomplete</h3>
            <p className="processing-error-message">{error}</p>
            <div className="processing-error-actions">
              <button
                className="btn btn-primary"
                onClick={handleRetry}
                id="processing-retry-btn"
                type="button"
              >
                <RefreshCw size={16} />
                <span>Retry</span>
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/screening/upload')}
                id="processing-back-btn"
                type="button"
              >
                <ArrowLeft size={16} />
                <span>Back to Upload</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sequential Processing Steps */}
            <div className="processing-steps">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`processing-step ${i < currentStep ? 'step-done' : ''} ${i === currentStep ? 'step-active' : ''} ${i > currentStep ? 'step-pending' : ''}`}
                >
                  <div className="step-dot">
                    {i < currentStep ? <ShieldCheck size={14} /> : null}
                    {i === currentStep ? <span className="step-spinner"></span> : null}
                  </div>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="processing-progress-bar">
              <div className="processing-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>

            <p className="processing-hint">{t('processing.pleaseWait')}</p>
          </>
        )}
      </div>
    </div>
  );
}
