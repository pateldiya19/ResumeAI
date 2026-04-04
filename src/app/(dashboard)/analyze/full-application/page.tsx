'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, Link2, FileText, Check, Rocket, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useUpload } from '@/hooks/use-upload';
import { useStartAnalysis } from '@/hooks/use-analysis';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';

const steps = [
  { label: 'Upload Resume', icon: Upload },
  { label: 'LinkedIn URLs', icon: Link2 },
  { label: 'Job Description', icon: FileText },
];

export default function FullApplicationPage() {
  const router = useRouter();
  const { upload, isUploading, progress, result: uploadResult, reset: resetUpload } = useUpload();
  const { startAnalysis, isStarting, error: analysisError } = useStartAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [candidateLinkedIn, setCandidateLinkedIn] = useState('');
  const [targetLinkedIn, setTargetLinkedIn] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [profileResume, setProfileResume] = useState<{ rawText: string; fileName: string } | null>(null);

  useEffect(() => {
    fetch('/api/user/profile').then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (data?.resumeText?.length > 50) setProfileResume({ rawText: data.resumeText, fileName: data.resumeFileName || 'profile-resume' });
    }).catch(() => {});
  }, []);

  const activeResume = uploadResult || profileResume;
  const currentStep = !activeResume ? 0 : !targetLinkedIn ? 1 : 2;

  const handleFile = async (file: File) => {
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!valid.includes(file.type)) { toast.error('Upload PDF, DOCX, or TXT.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB.'); return; }
    await upload(file);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResume) return;
    const result = await startAnalysis({
      mode: 'full_application',
      resumeText: activeResume.rawText,
      resumeFileName: activeResume.fileName,
      candidateLinkedInUrl: candidateLinkedIn || undefined,
      targetLinkedInUrl: targetLinkedIn,
      jobDescriptionText: jobDescription || undefined,
    });
    if (result?.analysisId || result?._id) {
      toast.success('Analysis started!');
      router.push(`/results/${result.analysisId || result._id}`);
    } else if (analysisError) { toast.error(analysisError); }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/analyze"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Full Application</h1>
            <p className="text-sm text-gray-500">Resume optimization + recruiter analysis + personalized emails</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isComplete = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all', isComplete && 'bg-brand-600 text-white', isCurrent && 'bg-brand-100 text-brand-700 ring-2 ring-brand-300', !isComplete && !isCurrent && 'bg-gray-100 text-gray-400')}>
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block', isCurrent ? 'text-brand-700' : isComplete ? 'text-gray-900' : 'text-gray-400')}>{step.label}</span>
                {i < steps.length - 1 && <div className={cn('flex-1 h-px', i < currentStep ? 'bg-brand-300' : 'bg-gray-200')} />}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Resume */}
          <Card>
            <CardContent className="p-5">
              <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">1</span>
                Resume {profileResume && !uploadResult ? '(from profile)' : 'Upload'}
              </label>
              {profileResume && !uploadResult && (
                <div className="mt-3 flex items-center justify-between bg-emerald-50/50 ring-1 ring-emerald-200/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-700" /></div>
                    <div><span className="text-sm font-medium text-gray-900">Resume loaded from profile</span><p className="text-xs text-gray-500">{profileResume.fileName}</p></div>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-600 font-medium">Upload different</button>
                </div>
              )}
              {!uploadResult && !profileResume && (
                <div className={cn('mt-3 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all', dragActive ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-brand-300')}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {isUploading ? <Loader2 className="w-8 h-8 text-brand-600 mx-auto animate-spin" /> : (
                    <><Upload className="w-8 h-8 text-brand-500 mx-auto mb-3" /><p className="text-sm text-gray-600">Drag & drop or <span className="font-semibold text-brand-600">browse</span></p><p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT (max 10MB)</p></>
                  )}
                </div>
              )}
              {uploadResult && (
                <div className="mt-3 flex items-center justify-between bg-brand-50/50 ring-1 ring-brand-200/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center"><Check className="w-4 h-4 text-brand-700" /></div>
                    <div><span className="text-sm font-medium">{uploadResult.fileName}</span><p className="text-xs text-gray-500">{uploadResult.fileType?.toUpperCase()}</p></div>
                  </div>
                  <button type="button" onClick={resetUpload} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Remove</button>
                </div>
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
                <label htmlFor="candidateLinkedIn" className="block text-xs font-medium text-gray-500 mb-1.5">Your LinkedIn URL <span className="text-gray-400">(optional)</span></label>
                <Input id="candidateLinkedIn" type="url" value={candidateLinkedIn} onChange={(e) => setCandidateLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
              </div>
              <div>
                <label htmlFor="targetLinkedIn" className="block text-xs font-medium text-gray-500 mb-1.5">Target Recruiter LinkedIn URL <span className="text-red-500">*</span></label>
                <Input id="targetLinkedIn" type="url" required value={targetLinkedIn} onChange={(e) => setTargetLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/recruiter" />
                <p className="text-xs text-gray-400 mt-1">Paste the LinkedIn URL of who you want to reach</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Job Description (paste only, no auto-generate) */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">3</span>
                Job Description <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <Textarea rows={5} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here for better targeting..." className="resize-none" />
              <p className="text-xs text-gray-400">Providing a JD helps the AI tailor your resume and emails more precisely.</p>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" size="lg" variant="gradient" className="w-full shadow-lg shadow-brand-500/20" disabled={!activeResume || !targetLinkedIn || isStarting}>
            {isStarting ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting Analysis...</> : <><Rocket className="w-4 h-4" /> Analyze & Generate<ArrowRight className="w-4 h-4" /></>}
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}
