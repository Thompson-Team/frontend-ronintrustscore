// Tipos globales
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Funciones que implementaste en otros archivos
import { connectWallet, switchToRoninSaigon, publishScoreFromWallet, getUserScore } from './api';
import { useReputationScore } from '@/hooks/useReputationScore';

// Exportaciones nombradas
export { connectWallet, switchToRoninSaigon, publishScoreFromWallet, getUserScore, useReputationScore };
