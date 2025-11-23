// src/hooks/useReputationScore.ts
import { useState } from 'react';
import { connectWallet, publishScoreFromWallet, getUserScore } from '@/services/api';

export const useReputationScore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  const connect = async () => {
    try {
      setLoading(true);
      const { address } = await connectWallet();
      setWallet(address);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const publishScore = async (proof: string, publicInputs: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await publishScoreFromWallet(proof, publicInputs);

      if (!result.success) {
        setError(result.error || 'Failed to publish score');
        return null;
      }

      return result.txHash;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getScore = async (address?: string) => {
    try {
      setLoading(true);
      setError(null);
      return await getUserScore(address);
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    wallet,
    loading,
    error,
    connect,
    publishScore,
    getScore
  };
};
