'use client';
import { useState, useEffect, useCallback } from 'react';

interface CreditData {
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  usage: {
    analysesUsed: number;
    analysesLimit: number;
    sendsUsed: number;
    sendsLimit: number;
  };
}

export function useCredits() {
  const [data, setData] = useState<CreditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/credits');
      if (!res.ok) throw new Error('Failed to fetch credits');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits: data?.credits ?? 0,
    plan: data?.plan ?? 'free',
    usage: data?.usage ?? { analysesUsed: 0, analysesLimit: 0, sendsUsed: 0, sendsLimit: 0 },
    isLoading,
    error,
    refetch: fetchCredits,
  };
}
