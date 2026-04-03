'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUpload } from '@/hooks/use-upload';
import { useStartAnalysis } from '@/hooks/use-analysis';

export default function AnalyzePage() {
  const router = useRouter();
  const { upload, isUploading, progress, error: uploadError, result: uploadResult, reset: resetUpload } = useUpload();
  const { startAnalysis, isStarting, error: analysisError } = useStartAnalysis();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [candidateLinkedIn, setCandidateLinkedIn] = useState('');
  const [targetLinkedIn, setTargetLinkedIn] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOCX, or TXT file.');
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
      jobDescriptionText: jobDescription || undefined,
    });

    if (result?._id) {
      router.push(`/results/${result._id}`);
    }
  };

  const error = uploadError || analysisError;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Analysis</h1>
        <p className="text-gray-500 mt-1">
          Upload your resume, provide the target recruiter, and let AI do the rest.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume Upload <span className="text-red-500">*</span>
          </label>
          {!uploadResult ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
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
                  <p className="text-sm text-gray-600 mb-2">Uploading... {progress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: 'hsl(160, 84%, 39%)' }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Drag & drop your resume or <span style={{ color: 'hsl(160, 84%, 39%)' }} className="font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT (max 10MB)</p>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-sm font-medium text-emerald-700">{uploadResult.fileName}</span>
              </div>
              <button
                type="button"
                onClick={resetUpload}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Candidate LinkedIn */}
        <div>
          <label htmlFor="candidateLinkedIn" className="block text-sm font-medium text-gray-700 mb-1">
            Your LinkedIn URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="candidateLinkedIn"
            type="url"
            value={candidateLinkedIn}
            onChange={(e) => setCandidateLinkedIn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/yourprofile"
          />
          <p className="text-xs text-gray-400 mt-1">Used for cross-referencing with your resume</p>
        </div>

        {/* Target LinkedIn */}
        <div>
          <label htmlFor="targetLinkedIn" className="block text-sm font-medium text-gray-700 mb-1">
            Target Recruiter LinkedIn URL <span className="text-red-500">*</span>
          </label>
          <input
            id="targetLinkedIn"
            type="url"
            required
            value={targetLinkedIn}
            onChange={(e) => setTargetLinkedIn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/recruiter"
          />
        </div>

        {/* Job Description */}
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="jobDescription"
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
            placeholder="Paste the job description here..."
          />
          <p className="text-xs text-gray-400 mt-1">
            If omitted, AI will generate a likely job description from the recruiter profile.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!uploadResult || !targetLinkedIn || isStarting}
          className="w-full py-3 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}
        >
          {isStarting ? 'Starting Analysis...' : 'Analyze Resume'}
        </button>
      </form>
    </div>
  );
}
