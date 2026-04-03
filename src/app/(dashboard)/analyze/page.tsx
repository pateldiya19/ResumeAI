'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, Link2, Target, FileText, Check, X, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useUpload } from '@/hooks/use-upload';
import { useStartAnalysis } from '@/hooks/use-analysis';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';

const steps = [
  { label: 'Upload Resume', icon: Upload },
  { label: 'LinkedIn URLs', icon: Link2 },
  { label: 'Job Description', icon: FileText },
];

export default function AnalyzePage() {
  const router = useRouter();
  const { upload, isUploading, progress, error: uploadError, result: uploadResult, reset: resetUpload } = useUpload();
  const { startAnalysis, isStarting, error: analysisError } = useStartAnalysis();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [candidateLinkedIn, setCandidateLinkedIn] = useState('');
  const [targetLinkedIn, setTargetLinkedIn] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jdMode, setJdMode] = useState<'paste' | 'auto'>('auto');
  const [dragActive, setDragActive] = useState(false);

  // Compute current step
  const currentStep = !uploadResult ? 0 : !targetLinkedIn ? 1 : 2;

  const handleFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.');
      return;
    }
    await upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadResult) return;

    const result = await startAnalysis({
      resumeText: uploadResult.rawText,
      resumeFileName: uploadResult.fileName,
      candidateLinkedInUrl: candidateLinkedIn || undefined,
      targetLinkedInUrl: targetLinkedIn,
      jobDescriptionText: jdMode === 'paste' ? jobDescription || undefined : undefined,
    });

    if (result?._id) {
      toast.success('Analysis started!');
      router.push(`/results/${result._id}`);
    } else if (analysisError) {
      toast.error(analysisError);
    }
  };

  const error = uploadError || analysisError;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your resume, provide the target recruiter, and let AI do the rest.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isComplete = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                    isComplete && 'bg-brand-600 text-white',
                    isCurrent && 'bg-brand-100 text-brand-700 ring-2 ring-brand-300',
                    !isComplete && !isCurrent && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block',
                  isCurrent ? 'text-brand-700' : isComplete ? 'text-gray-900' : 'text-gray-400'
                )}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px',
                    i < currentStep ? 'bg-brand-300' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: File Upload */}
          <Card>
            <CardContent className="p-5">
              <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">1</span>
                Resume Upload <span className="text-red-500">*</span>
              </label>

              {!uploadResult ? (
                <div
                  className={cn(
                    'mt-3 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                    dragActive
                      ? 'border-brand-500 bg-brand-50/50'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/20'
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
                      <Loader2 className="w-8 h-8 text-brand-600 mx-auto mb-3 animate-spin" />
                      <p className="text-sm text-gray-600 mb-2">Uploading... {progress}%</p>
                      <div className="max-w-xs mx-auto w-full bg-gray-100 rounded-full h-1.5">
                        <motion.div
                          className="h-1.5 rounded-full bg-brand-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-6 h-6 text-brand-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Drag & drop your resume or{' '}
                        <span className="font-semibold text-brand-600">browse</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT (max 10MB)</p>
                    </>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 flex items-center justify-between bg-brand-50/50 ring-1 ring-brand-200/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-brand-700" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{uploadResult.fileName}</span>
                      <p className="text-xs text-gray-500">{uploadResult.fileType?.toUpperCase()}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Remove
                  </button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: LinkedIn URLs */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">2</span>
                LinkedIn URLs
              </label>

              <div>
                <label htmlFor="candidateLinkedIn" className="block text-xs font-medium text-gray-500 mb-1.5">
                  Your LinkedIn URL <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  id="candidateLinkedIn"
                  type="url"
                  value={candidateLinkedIn}
                  onChange={(e) => setCandidateLinkedIn(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                <p className="text-xs text-gray-400 mt-1">Used for cross-referencing with your resume</p>
              </div>

              <div>
                <label htmlFor="targetLinkedIn" className="block text-xs font-medium text-gray-500 mb-1.5">
                  Target Recruiter LinkedIn URL <span className="text-red-500">*</span>
                </label>
                <Input
                  id="targetLinkedIn"
                  type="url"
                  required
                  value={targetLinkedIn}
                  onChange={(e) => setTargetLinkedIn(e.target.value)}
                  placeholder="https://linkedin.com/in/recruiter"
                />
                <p className="text-xs text-gray-400 mt-1">Paste the LinkedIn URL of who you want to reach</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Job Description */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">3</span>
                Job Description <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>

              {/* Toggle */}
              <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setJdMode('auto')}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                    jdMode === 'auto' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                  Auto-generate
                </button>
                <button
                  type="button"
                  onClick={() => setJdMode('paste')}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                    jdMode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  )}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                  Paste JD
                </button>
              </div>

              {jdMode === 'paste' ? (
                <Textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                />
              ) : (
                <div className="rounded-xl bg-brand-50/50 p-4 ring-1 ring-brand-100 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-brand-800">AI will generate a JD</p>
                    <p className="text-xs text-brand-600/70 mt-0.5">
                      Based on the recruiter&apos;s profile, company, and role context.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            variant="gradient"
            className="w-full shadow-lg shadow-brand-500/20"
            disabled={!uploadResult || !targetLinkedIn || isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Resume
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}
