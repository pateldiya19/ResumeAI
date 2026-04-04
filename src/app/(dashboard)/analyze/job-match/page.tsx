'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, Check, Target, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useUpload } from '@/hooks/use-upload';
import { useStartAnalysis } from '@/hooks/use-analysis';
import { JobMatchResults } from '@/components/results/job-match-results';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';
import type { Mode2Results } from '@/types/analysis';

export default function JobMatchPage() {
  const { upload, isUploading, progress, result: uploadResult, reset: resetUpload } = useUpload();
  const { startAnalysis, isStarting } = useStartAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode2Results, setMode2Results] = useState<Mode2Results | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [profileResume, setProfileResume] = useState<{ rawText: string; fileName: string } | null>(null);

  useEffect(() => {
    fetch('/api/user/profile').then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (data?.resumeText?.length > 50) setProfileResume({ rawText: data.resumeText, fileName: data.resumeFileName || 'profile-resume' });
    }).catch(() => {});
  }, []);

  const activeResume = uploadResult || profileResume;

  const handleFile = async (file: File) => {
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!valid.includes(file.type)) { toast.error('Upload PDF, DOCX, or TXT.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB.'); return; }
    await upload(file);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResume || !jobDescription.trim()) return;
    setIsAnalyzing(true); setMode2Results(null);
    try {
      const result = await startAnalysis({ mode: 'job_analysis', resumeText: activeResume.rawText, resumeFileName: activeResume.fileName, jobDescriptionText: jobDescription });
      if (result?.status === 'complete') { setMode2Results(result); toast.success('Job match analysis complete!'); }
    } catch { toast.error('Analysis failed.'); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/analyze"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Match Analysis</h1>
            <p className="text-sm text-gray-500">Compare your resume against a specific job description</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume */}
          <Card>
            <CardContent className="p-5">
              <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">1</span>
                Resume {profileResume && !uploadResult ? '(from profile)' : 'Upload'}
              </label>
              {profileResume && !uploadResult && (
                <div className="mt-3 flex items-center justify-between bg-emerald-50/50 ring-1 ring-emerald-200/50 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-700" /></div>
                    <div><span className="text-sm font-medium text-gray-900">Resume loaded from profile</span><p className="text-xs text-gray-500">{profileResume.fileName}</p></div>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-600 font-medium">Upload different</button>
                </div>
              )}
              {!uploadResult && !profileResume && (
                <div className={cn('mt-3 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all', dragActive ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200 hover:border-purple-300')}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {isUploading ? <Loader2 className="w-8 h-8 text-purple-600 mx-auto animate-spin" /> : (
                    <><Upload className="w-8 h-8 text-purple-500 mx-auto mb-3" /><p className="text-sm text-gray-600">Drag & drop or <span className="font-semibold text-purple-600">browse</span></p></>
                  )}
                </div>
              )}
              {uploadResult && (
                <div className="mt-3 flex items-center justify-between bg-purple-50/50 ring-1 ring-purple-200/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Check className="w-4 h-4 text-purple-700" /></div>
                    <div><span className="text-sm font-medium">{uploadResult.fileName}</span><p className="text-xs text-gray-500">{uploadResult.fileType?.toUpperCase()}</p></div>
                  </div>
                  <button type="button" onClick={resetUpload} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Remove</button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">2</span>
                Paste Job Description <span className="text-red-500">*</span>
              </label>
              <Textarea rows={8} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Copy and paste the full job posting here..." className="resize-none" />
              <p className="text-xs text-gray-400">Paste the complete job description for the best skill matching and improvement suggestions.</p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20"
            disabled={!activeResume || !jobDescription.trim() || isStarting || isAnalyzing}>
            {isStarting || isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Job Fit...</> : <><Target className="w-4 h-4" /> Analyze Job Fit<ArrowRight className="w-4 h-4" /></>}
          </Button>
        </form>

        {(isStarting || isAnalyzing) && !mode2Results && <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>}
        {mode2Results && <div className="mt-4"><JobMatchResults data={mode2Results} /></div>}
      </div>
    </PageTransition>
  );
}
