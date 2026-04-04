'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResponse, AnalysisMode } from '@/types/analysis';

export function useAnalysis(id: string) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyze/${id}`);
      if (!res.ok) throw new Error('Failed to fetch analysis');
      const data = await res.json();
      setAnalysis(data);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchAnalysis();

    const interval = setInterval(async () => {
      const data = await fetchAnalysis();
      if (data && ['complete', 'failed'].includes(data.status)) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, fetchAnalysis]);

  return { analysis, isLoading, error, refetch: fetchAnalysis };
}

export function useStartAnalysis() {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (data: {
    mode?: AnalysisMode;
    resumeText: string;
    resumeFileName: string;
    candidateLinkedInUrl?: string;
    targetLinkedInUrl?: string;
    jobDescriptionText?: string;
  }) => {
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start analysis');
      }
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  return { startAnalysis, isStarting, error };
}

