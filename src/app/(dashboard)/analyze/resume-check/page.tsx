'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, Check, X, Zap, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useUpload } from '@/hooks/use-upload';
import { useStartAnalysis } from '@/hooks/use-analysis';
import { ResumeCheckResults } from '@/components/results/resume-check-results';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';
import type { Mode1Results } from '@/types/analysis';

export default function ResumeCheckPage() {
  const { upload, isUploading, progress, result: uploadResult, reset: resetUpload } = useUpload();
  const { startAnalysis, isStarting } = useStartAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode1Results, setMode1Results] = useState<Mode1Results | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    if (!activeResume) return;
    setIsAnalyzing(true); setMode1Results(null);
    try {
      const result = await startAnalysis({ mode: 'resume_only', resumeText: activeResume.rawText, resumeFileName: activeResume.fileName });
      if (result?.status === 'complete') { setMode1Results(result); toast.success('Resume analysis complete!'); }
    } catch { toast.error('Analysis failed.'); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/analyze"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Check</h1>
            <p className="text-sm text-gray-500">Get an instant ATS health score and improvement tips</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
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
                <div className={cn('mt-3 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all', dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300')}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {isUploading ? <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" /> : (
                    <><Upload className="w-8 h-8 text-blue-500 mx-auto mb-3" /><p className="text-sm text-gray-600">Drag & drop or <span className="font-semibold text-blue-600">browse</span></p><p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT (max 10MB)</p></>
                  )}
                </div>
              )}

              {uploadResult && (
                <div className="mt-3 flex items-center justify-between bg-blue-50/50 ring-1 ring-blue-200/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Check className="w-4 h-4 text-blue-700" /></div>
                    <div><span className="text-sm font-medium text-gray-900">{uploadResult.fileName}</span><p className="text-xs text-gray-500">{uploadResult.fileType?.toUpperCase()}</p></div>
                  </div>
                  <button type="button" onClick={resetUpload} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Remove</button>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20"
            disabled={!activeResume || isStarting || isAnalyzing}>
            {isStarting || isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4" /> Analyze My Resume<ArrowRight className="w-4 h-4" /></>}
          </Button>
        </form>

        {(isStarting || isAnalyzing) && !mode1Results && <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>}
        {mode1Results && <div className="mt-4"><ResumeCheckResults data={mode1Results} /></div>}
      </div>
    </PageTransition>
  );
}
