'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ChevronLeft, Info, Upload, Loader2, Check, FileText, Linkedin, Zap } from 'lucide-react';
import { HiBadgeCheck } from 'react-icons/hi';
import { useUpload } from '@/hooks/use-upload';
import { cn } from '@/lib/cn';

export default function OnboardingPage() {
  const router = useRouter();
  const { upload, isUploading, progress, result: uploadResult, reset: resetUpload } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const totalSteps = 3;
  const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };
  const progressSpring = { type: 'spring' as const, stiffness: 100, damping: 20 };

  const analysisSteps = ['Parsing resume', 'Fetching LinkedIn', 'Running AI analysis', 'Building dashboard'];

  const handleFile = async (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) { toast.error('Please upload a PDF, DOCX, or TXT file.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be under 10MB.'); return; }
    await upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleNext = () => {
    if (currentStep === 1 && !uploadResult) {
      toast.error('Please upload your resume first.');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      if (currentStep === 2) runAnalysis();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isAnalyzing) setCurrentStep((prev) => prev - 1);
  };

  const runAnalysis = async () => {
    if (!uploadResult) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Slow ticker: advance every 8s, stop at second-to-last step (wait for API to finish for final)
    const ticker = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(prev + 1, analysisSteps.length - 2));
    }, 8000);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: uploadResult.rawText,
          resumeFileName: uploadResult.fileName,
          linkedinUrl: linkedinUrl || undefined,
        }),
      });
      clearInterval(ticker);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Onboarding failed'); }
      // Animate through remaining steps quickly
      setAnalysisProgress(analysisSteps.length - 1);
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisProgress(analysisSteps.length);
      toast.success('Profile setup complete!');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: unknown) {
      clearInterval(ticker);
      setIsAnalyzing(false);
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Check your API keys.');
      setCurrentStep(1);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-transparent p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-[32px] border bg-white p-2 shadow-xl md:h-[600px] md:max-w-5xl md:flex-row"
      >
        {/* ── Left Section ── */}
        <div className="flex flex-[1.2] flex-col justify-center rounded-[26px] border border-black/5 bg-[#FAFAFA] px-8 py-10 md:rounded-l-[26px] md:rounded-r-none md:border-r-0 md:px-16">
          <div className="mx-auto w-full max-w-sm">
            {/* Logo */}
            <div className="mb-8 flex justify-center md:justify-start">
              <div className="rounded-xl bg-brand-100 p-2.5">
                <Zap className="w-6 h-6 text-brand-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#1A1A1A]">
              {currentStep === 1 && 'Upload Your Resume'}
              {currentStep === 2 && 'Connect LinkedIn'}
              {currentStep === 3 && 'Analyzing Your Profile'}
            </h1>
            <p className="mb-8 text-sm text-gray-500">
              {currentStep === 1 && "We'll analyze your professional standing and build your dashboard."}
              {currentStep === 2 && "Cross-reference with your resume for consistency insights."}
              {currentStep === 3 && 'This takes about 30 seconds. Sit tight!'}
            </p>

            {/* Stepper */}
            <div className="mb-10 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/5">
                  <motion.div
                    animate={{ width: i <= currentStep ? '100%' : '0%' }}
                    transition={progressSpring}
                    className="absolute top-0 left-0 h-full bg-brand-500"
                  />
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="mb-10 space-y-6 text-left min-h-[160px]">
              {/* Step 1: Resume Upload */}
              {currentStep === 1 && (
                <>
                  {!uploadResult ? (
                    <div
                      className={cn(
                        'border-[1.5px] border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                        dragActive ? 'border-brand-500 bg-brand-50/50' : 'border-black/15 hover:border-brand-400 hover:bg-brand-50/20'
                      )}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      />
                      {isUploading ? (
                        <div>
                          <Loader2 className="w-8 h-8 text-brand-600 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-600">Uploading... {progress}%</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-brand-500 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">
                            Drag & drop or <span className="font-semibold text-brand-600">browse</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT (max 10MB)</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between rounded-2xl border-[1.5px] border-brand-200 bg-brand-50/30 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                          <Check className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{uploadResult.fileName}</p>
                          <p className="text-xs text-gray-500">{uploadResult.fileType?.toUpperCase()}</p>
                        </div>
                      </div>
                      <button onClick={resetUpload} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Remove</button>
                    </motion.div>
                  )}
                </>
              )}

              {/* Step 2: LinkedIn URL */}
              {currentStep === 2 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold tracking-wider whitespace-nowrap text-[#808080] uppercase">
                    LinkedIn Profile URL <Info size={14} className="opacity-50" />
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full rounded-2xl border-[1.5px] border-black/15 bg-white pl-11 pr-5 py-3.5 text-sm text-black transition-all outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Optional — skip this if you prefer not to connect LinkedIn.</p>
                </div>
              )}

              {/* Step 3: Analysis Progress */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  {analysisSteps.map((label, i) => {
                    const isComplete = i < analysisProgress;
                    const isCurrent = i === analysisProgress && isAnalyzing;
                    return (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-3"
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all',
                          isComplete && 'bg-brand-600 text-white',
                          isCurrent && 'bg-brand-100 text-brand-700',
                          !isComplete && !isCurrent && 'bg-gray-100 text-gray-400'
                        )}>
                          {isComplete ? <Check className="w-3.5 h-3.5" /> : isCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                        </div>
                        <span className={cn('text-sm', isComplete && 'text-gray-900 font-medium', isCurrent && 'text-brand-700 font-semibold', !isComplete && !isCurrent && 'text-gray-400')}>
                          {label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            {currentStep < 3 && (
              <div className="flex flex-nowrap items-center gap-2 md:gap-4">
                <motion.button
                  onClick={handleBack}
                  whileTap={{ scale: 0.95 }}
                  disabled={currentStep === 1}
                  className="shrink-0 rounded-2xl border border-black/10 bg-white p-4 text-[#666666] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={20} />
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  whileTap={{ scale: 0.98 }}
                  disabled={currentStep === 1 && !uploadResult}
                  className="flex min-w-fit flex-1 items-center justify-center rounded-2xl bg-brand-600 px-8 py-4 text-sm font-bold whitespace-nowrap text-white shadow-xl disabled:opacity-50 hover:bg-brand-500 transition-colors"
                >
                  {currentStep === 2 ? 'Start Analysis' : 'Continue Setup'}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Section ── */}
        <div className="relative hidden flex-1 flex-col items-center justify-center rounded-[26px] border border-black/5 bg-gradient-to-br from-brand-50 to-blue-50 p-12 md:flex md:rounded-l-none md:rounded-r-[26px] md:border-l-0">
          {/* Preview card tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 -mb-5 rounded-2xl border border-[#E5E5E5] bg-white px-4 py-2 text-center text-xs font-medium whitespace-nowrap text-black shadow-lg"
          >
            <p>{currentStep === 1 ? 'Upload your resume to get started' : currentStep === 2 ? 'Connect for consistency insights' : 'AI is building your dashboard'}</p>
            <p className="text-[10px] font-normal opacity-60">
              {currentStep === 1 ? 'PDF, DOCX, or TXT' : currentStep === 2 ? 'Optional but recommended' : 'Almost done...'}
            </p>
          </motion.div>

          {/* Preview card */}
          <motion.div
            layout
            transition={spring}
            className="relative my-8 flex aspect-square w-full max-w-72 flex-col items-center justify-center rounded-[32px] border-2 border-[#E5E5E5] bg-white p-8 shadow-sm"
          >
            {currentStep === 1 && (
              <>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-400 shadow-inner">
                  <FileText size={24} strokeWidth={1.5} />
                </div>
                <div className="mb-6 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {uploadResult ? uploadResult.fileName : 'Your Resume'}
                  </span>
                  {uploadResult && <HiBadgeCheck size={18} className="shrink-0 text-brand-500" />}
                </div>
                <div className="w-full space-y-2 opacity-20">
                  <div className={cn('h-1.5 w-full rounded-full bg-black', uploadResult && 'bg-brand-600 opacity-100')} />
                  <div className="mx-auto h-1.5 w-2/3 rounded-full bg-black" />
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-400 shadow-inner">
                  <Linkedin size={24} strokeWidth={1.5} />
                </div>
                <div className="mb-6 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {linkedinUrl ? 'LinkedIn Connected' : 'Your Profile'}
                  </span>
                  {linkedinUrl && <HiBadgeCheck size={18} className="shrink-0 text-blue-500" />}
                </div>
                <div className="w-full space-y-2 opacity-20">
                  <div className="h-1.5 w-full rounded-full bg-black" />
                  <div className="mx-auto h-1.5 w-2/3 rounded-full bg-black" />
                </div>
              </>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col items-center gap-6">
                {/* Pulsing rings animation */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-20 h-20 rounded-2xl border-2 border-brand-300"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute w-20 h-20 rounded-2xl border-2 border-blue-300"
                  />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-blue-100">
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Zap size={28} className="text-brand-600" />
                    </motion.div>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-brand-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <p className="max-w-64 text-center text-xs leading-relaxed text-gray-500">
            {currentStep === 1 && 'Your resume will be analyzed for ATS compatibility, skills extraction, and professional insights.'}
            {currentStep === 2 && "We'll cross-reference your LinkedIn with your resume to identify consistency gaps."}
            {currentStep === 3 && 'Building your personalized dashboard with scores, skills, and improvement recommendations.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
