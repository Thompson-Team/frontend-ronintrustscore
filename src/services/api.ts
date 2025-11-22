import { QuestionnaireResponse, ReputationScore } from '@/types/questionnaire';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Mock para simular respuestas (remover cuando haya backend real)
const MOCK_MODE = true;

/**
 * Endpoint para conectar wallet y verificar identidad
 * POST /api/wallet/connect
 */
export const connectWallet = async (address: string, signature: string): Promise<{ token: string }> => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ token: 'mock_jwt_token_' + address });
      }, 500);
    });
  }

  const response = await fetch(`${API_BASE_URL}/wallet/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature })
  });

  if (!response.ok) throw new Error('Failed to connect wallet');
  return response.json();
};

/**
 * Endpoint para enviar respuestas del cuestionario y obtener análisis de IA
 * POST /api/questionnaire/submit
 */
export const submitQuestionnaire = async (data: QuestionnaireResponse): Promise<ReputationScore> => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular cálculo de score
        const mockScore = Math.floor(Math.random() * 30) + 70; // Score entre 70-100
        resolve({
          score: mockScore,
          walletAddress: data.walletAddress,
          timestamp: new Date().toISOString(),
          breakdown: {
            trustworthiness: Math.floor(Math.random() * 30) + 70,
            security: Math.floor(Math.random() * 30) + 70,
            experience: Math.floor(Math.random() * 30) + 70,
            behavior: Math.floor(Math.random() * 30) + 70
          }
        });
      }, 2000);
    });
  }

  const response = await fetch(`${API_BASE_URL}/questionnaire/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to submit questionnaire');
  return response.json();
};

/**
 * Endpoint para publicar score en blockchain
 * POST /api/blockchain/publish-score
 */
export const publishScoreOnChain = async (score: ReputationScore): Promise<{ txHash: string }> => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ txHash: '0x' + Math.random().toString(16).substring(2, 66) });
      }, 1500);
    });
  }

  const response = await fetch(`${API_BASE_URL}/blockchain/publish-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(score)
  });

  if (!response.ok) throw new Error('Failed to publish score on-chain');
  return response.json();
};

/**
 * Endpoint para obtener score de una wallet desde blockchain
 * GET /api/blockchain/score/:address
 */
export const getWalletScore = async (address: string): Promise<ReputationScore | null> => {
  if (MOCK_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null); // No score encontrado
      }, 500);
    });
  }

  const response = await fetch(`${API_BASE_URL}/blockchain/score/${address}`);
  
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch wallet score');
  return response.json();
};
/**
 * Verificar Twitter con Vlayer
 * POST /api/vlayer/verify-twitter
 */
export const verifyTwitter = async (
  walletAddress: string, 
  twitterHandle: string
): Promise<{
  verified: boolean;
  followerCount: number;
  proof: string;
  timestamp: string;
}> => {
  if (MOCK_MODE) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular verificación con 80% de éxito
        const hasEnoughFollowers = Math.random() > 0.2;
        
        if (hasEnoughFollowers) {
          resolve({
            verified: true,
            followerCount: Math.floor(Math.random() * 500) + 100,
            proof: 'zk_proof_' + Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error('Not enough followers. You need at least 100 followers.'));
        }
      }, 2000);
    });
  }

  const response = await fetch(`${API_BASE_URL}/vlayer/verify-twitter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, twitterHandle })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify Twitter');
  }
  
  return response.json();
};

/**
 * Verificar Google con Vlayer y Vouch
 * POST /api/vlayer/verify-google
 */
export const verifyGoogle = async (
  walletAddress: string,
  googleEmail: string
): Promise<{
  verified: boolean;
  vouchScore: number;
  proof: string;
  timestamp: string;
}> => {
  if (MOCK_MODE) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular verificación con 85% de éxito
        const isValid = Math.random() > 0.15;
        
        if (isValid) {
          resolve({
            verified: true,
            vouchScore: Math.floor(Math.random() * 30) + 70,
            proof: 'zk_proof_' + Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error('Could not verify Google account with Vouch.'));
        }
      }, 2000);
    });
  }

  const response = await fetch(`${API_BASE_URL}/vlayer/verify-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, googleEmail })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify Google');
  }
  
  return response.json();
};
