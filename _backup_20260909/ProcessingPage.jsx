import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, ShieldCheck, Sparkles } from 'lucide-react';
import { predictFundusImage } from '../services/api';
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

  const steps = [
    t('processing.step1') || 'Image received',
    t('processing.step2') || 'Retinal image processed',
    t('processing.step3') || 'Diabetic retinopathy analysis',
    t('processing.step4') || 'Additional retinal findings',
    t('processing.step5') || 'AI attention analysis',
    t('processing.step6') || 'Report preparation',
  ];

  useEffect(() => {
    let isCancelled = false;
    const targetPatientId = selectedPatient?.patientId;
    if (!uploadedImage || !targetPatientId) {
      showToast('Select a patient and fundus image before analysis.', 'error');
      navigate('/screening');
      return undefined;
    }

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
        
        // Ensure result contains the exact screeningId from backend
        setLatestResult({
          ...result,
          patientId: targetPatientId,
          patientName: selectedPatient.fullName
        });

        setTimeout(() => {
          navigate(`/result/${result.screeningId}`);
        }, 400);
      })
      .catch(error => {
        if (isCancelled) return;
        console.error('Inference error:', error);
        showToast(error);
        navigate('/screening/upload');
      })
      .finally(() => {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      });

    return () => {
      isCancelled = true;
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [navigate, steps.length, uploadedImage, selectedPatient, setLatestResult, showToast]);

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
      </div>
    </div>
  );
}
