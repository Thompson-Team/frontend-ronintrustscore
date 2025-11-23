// api.ts - FRONTEND API corregida para usar SOLO Ronin Wallet

import { QuestionnaireResponse, ReputationScore } from '@/types/questionnaire';
import { ethers } from 'ethers';
import { roninWallet } from '@/lib/roninWallet';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Contract ABIs
const REPUTATION_ORACLE_ABI = [
  "function publishScore(bytes calldata proof, bytes calldata publicInputs) external",
  "function getScore(address user) external view returns (uint256 score, uint256 timestamp, bool verified)",
  "event ScorePublished(address indexed user, uint256 score, uint256 timestamp, bytes32 proofHash)"
];

const ORACLE_CONTRACT_ADDRESS = '0x38E457edc317809F135E47697666cFc074397e1B';
const RONIN_CHAIN_ID = 2021; // Saigon testnet

/**
 * Endpoint para conectar wallet y verificar identidad
 */
export const connectWallet = async (): Promise<{
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.Signer;
}> => {
  // Verificar que Ronin Wallet esté instalada
  if (!roninWallet.isInstalled()) {
    throw new Error('Please install Ronin Wallet from https://wallet.roninchain.com/');
  }

  try {
    // Conectar con Ronin Wallet
    const address = await roninWallet.connect();
    
    // Obtener provider de Ronin
    const roninProvider = roninWallet.getProvider();
    if (!roninProvider) {
      throw new Error('Failed to get Ronin Wallet provider');
    }

    const provider = new ethers.BrowserProvider(roninProvider);
    const signer = await provider.getSigner();

    // Verificar que está en la red correcta
    const chainId = await roninWallet.getChainId();
    if (chainId !== RONIN_CHAIN_ID) {
      console.log('⚠️ Wrong network, switching to Ronin Saigon...');
      await switchToRoninSaigon();
    }

    console.log('✅ Ronin Wallet connected:', address);
    return { address, provider, signer };
  } catch (error: any) {
    console.error('Failed to connect Ronin Wallet:', error);
    throw error;
  }
};

/**
 * Cambiar a la red Ronin Saigon
 */
export const switchToRoninSaigon = async (): Promise<void> => {
  if (!roninWallet.isInstalled()) {
    throw new Error('Ronin Wallet not found');
  }

  try {
    await roninWallet.switchChain(RONIN_CHAIN_ID);
  } catch (switchError: any) {
    // Si la red no está agregada, agregarla
    if (switchError.code === 4902) {
      await roninWallet.addChain({
        chainId: RONIN_CHAIN_ID,
        chainName: 'Ronin Saigon Testnet',
        nativeCurrency: {
          name: 'RON',
          symbol: 'RON',
          decimals: 18,
        },
        rpcUrls: ['https://saigon-testnet.roninchain.com/rpc'],
        blockExplorerUrls: ['https://saigon-app.roninchain.com/'],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Endpoint para enviar respuestas del cuestionario y obtener análisis de IA
 * POST /api/questionnaire/submit
 */
export const submitQuestionnaire = async (data: QuestionnaireResponse): Promise<ReputationScore> => {
  const response = await fetch(`${API_BASE_URL}/questionnaire/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to submit questionnaire');
  }

  return response.json();
};

/**
 * Endpoint para publicar score en blockchain
 * POST /api/blockchain/publish-score
 */
export const publishScoreFromWallet = async (
  proof: string,
  publicInputs: string
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    console.log('Publishing score from user wallet...');

    // Conectar wallet de Ronin
    const { signer, address } = await connectWallet();
    console.log('User address:', address);

    // Crear instancia del contrato con el signer del usuario
    const oracleContract = new ethers.Contract(
      ORACLE_CONTRACT_ADDRESS,
      REPUTATION_ORACLE_ABI,
      signer
    );

    // Convertir a bytes
    const proofBytes = ethers.getBytes(proof);
    const publicInputsBytes = ethers.getBytes(publicInputs);

    // Decodificar para mostrar al usuario
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ['address', 'uint256', 'uint256'],
      publicInputs
    );
    
    console.log('📊 Score details:');
    console.log('   Address:', decoded[0]);
    console.log('   Score:', decoded[1].toString());
    console.log('   Timestamp:', new Date(Number(decoded[2]) * 1000).toISOString());

    // Verificar que la dirección coincide
    if (decoded[0].toLowerCase() !== address.toLowerCase()) {
      throw new Error('Address mismatch: This score belongs to a different wallet');
    }

    // Estimar gas
    console.log('Estimating gas...');
    const gasEstimate = await oracleContract.publishScore.estimateGas(
      proofBytes,
      publicInputsBytes
    );
    console.log('   Estimated gas:', gasEstimate.toString());

    // Enviar transacción (el usuario verá el popup de confirmación)
    console.log('Sending transaction (please confirm in your wallet)...');
    const tx = await oracleContract.publishScore(
      proofBytes,
      publicInputsBytes,
      {
        gasLimit: gasEstimate * 120n / 100n // +20% buffer
      }
    );

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');

    // Esperar confirmación
    const receipt = await tx.wait();

    console.log('   Score published successfully!');
    console.log('   Block:', receipt.blockNumber);
    console.log('   Gas used:', receipt.gasUsed.toString());
    console.log('   TX Hash:', receipt.hash);

    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error: any) {
    console.error('Failed to publish score:', error);
    
    let errorMessage = error.message;
    
    // Errores comunes
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      errorMessage = 'Transaction rejected by user';
    } else if (error.message.includes('Address mismatch')) {
      errorMessage = 'This score does not belong to your wallet';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient RON tokens for gas';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Obtener score del usuario desde blockchain
 * VERSION DEBUG: Verifica el contrato y prueba diferentes métodos
 */
export const getUserScore = async (
  userAddress?: string
): Promise<ReputationScore | null> => {
  console.log('=== getUserScore CALLED ===');
  
  // Verificar que Ronin Wallet está instalada
  if (!roninWallet.isInstalled()) {
    const error = new Error('Ronin Wallet is not installed');
    console.error('ERROR:', error);
    throw error;
  }

  // Obtener el provider de Ronin Wallet
  const roninProvider = roninWallet.getProvider();
  console.log('Ronin Provider:', roninProvider ? 'Available' : 'NULL');
  
  if (!roninProvider) {
    const error = new Error('Ronin Wallet provider not available');
    console.error('ERROR:', error);
    throw error;
  }

  // Crear provider de ethers con Ronin Wallet
  console.log('Creating ethers provider...');
  const provider = new ethers.BrowserProvider(roninProvider);
  console.log('Ethers provider created');
  
  // Si no se proporciona dirección, usar la wallet conectada
  let address = userAddress;
  if (!address) {
    console.log('Getting signer address...');
    const signer = await provider.getSigner();
    address = await signer.getAddress();
    console.log('Signer address:', address);
  }

  console.log('Fetching score for address:', address);
  console.log('Oracle contract:', ORACLE_CONTRACT_ADDRESS);
  
  const network = await provider.getNetwork();
  console.log('Network details:', {
    name: network.name,
    chainId: network.chainId.toString(),
    chainIdNumber: Number(network.chainId)
  });
  
  // Verificar que estamos en Ronin Saigon
  if (Number(network.chainId) !== RONIN_CHAIN_ID) {
    console.warn(`Wrong network! Connected to chainId ${network.chainId}, switching to Ronin Saigon (${RONIN_CHAIN_ID})...`);
    
    try {
      await switchToRoninSaigon();
      console.log('Switched to Ronin Saigon, please try again');
      
      // Informar al usuario que debe reintentar
      throw new Error(`Switched to Ronin Saigon Testnet. Please try again.`);
    } catch (switchError: any) {
      console.error('Failed to switch network:', switchError);
      throw new Error(`Wrong network! Please manually switch to Ronin Saigon Testnet (chainId: ${RONIN_CHAIN_ID}). Currently on chainId: ${network.chainId}`);
    }
  }

  // PASO 1: Verificar que el contrato existe
  console.log('Checking if contract exists...');
  const code = await provider.getCode(ORACLE_CONTRACT_ADDRESS);
  console.log('Contract code length:', code.length);
  
  if (code === '0x' || code.length <= 2) {
    console.error('CONTRACT NOT FOUND!');
    console.error('Searched at:', ORACLE_CONTRACT_ADDRESS);
    console.error('On network:', network.name, `(chainId: ${network.chainId})`);
    console.error('');
    console.error('Possible solutions:');
    console.error('   1. Deploy the contract to Ronin Saigon Testnet');
    console.error('   2. Update ORACLE_CONTRACT_ADDRESS in your .env file');
    console.error('   3. Check that you are on the correct network');
    console.error('');
    console.error('Verify contract on explorer:');
    console.error(`   https://saigon-app.roninchain.com/address/${ORACLE_CONTRACT_ADDRESS}`);
    
    throw new Error('Contract does not exist at this address! Please check ORACLE_CONTRACT_ADDRESS and network.');
  }
  console.log('Contract exists');

  // PASO 2: Crear contrato con ABI completo
  const oracleContract = new ethers.Contract(
    ORACLE_CONTRACT_ADDRESS,
    REPUTATION_ORACLE_ABI,
    provider
  );
  console.log('✅ Contract instance created');

  // PASO 3: Intentar llamar al método getScore
  console.log('📞 Calling contract.getScore()...');
  
  try {
    const result = await oracleContract.getScore(address);
    
    console.log('📦 Raw contract result:', {
      score: result.score.toString(),
      timestamp: result.timestamp.toString(),
      verified: result.verified,
      fullResult: result
    });

    const totalScore = Number(result.score);
    console.log('📊 Score parsed:', totalScore);

    // Si el score es 0, significa que no hay score registrado
    if (totalScore === 0) {
      console.log('ℹ️ Score is 0, no reputation published yet');
      return null;
    }

    // Crear breakdown consistente con el totalScore
    const breakdown = {
      trustworthiness: Math.round(totalScore * 0.3),
      security: Math.round(totalScore * 0.25),
      experience: Math.round(totalScore * 0.25),
      behavior: Math.round(totalScore * 0.2),
    };

    const finalResult = {
      walletAddress: address,
      score: totalScore,
      timestamp: new Date(Number(result.timestamp) * 1000).toISOString(),
      breakdown
    };

    console.log('✅ Final result:', finalResult);
    return finalResult;
    
  } catch (error: any) {
    console.error('❌ Contract call failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      reason: error.reason,
      data: error.data,
      info: error.info
    });

    // CASO 1: "No score found" - Comportamiento esperado
    if (error.reason === 'No score found' || 
        error.message.includes('No score found')) {
      console.log('ℹ️ No score found for this address (expected when score not published yet)');
      return null;
    }

    // CASO 2: BAD_DATA - El contrato devuelve 0x (sin revert message)
    if (error.code === 'BAD_DATA') {
      console.warn('⚠️ Contract returned empty data (0x)');
      console.warn('This usually means no score exists for this address');
      return null;
    }

    // CASO 3: CALL_EXCEPTION con "No score found"
    if (error.code === 'CALL_EXCEPTION' && 
        (error.reason === 'No score found' || error.message.includes('No score found'))) {
      console.log('ℹ️ No score published yet for this address');
      return null;
    }

    // CASO 4: Otros errores - re-lanzar para debugging
    console.error('❌ Unexpected error, re-throwing for debugging');
    throw error;
  }
};

/**
 * Verificar si hay un score publicado para una dirección
 */
export const hasPublishedScore = async (userAddress: string): Promise<boolean> => {
  try {
    const score = await getUserScore(userAddress);
    return score !== null && score.score > 0;
  } catch (error) {
    console.error('Error checking if score exists:', error);
    return false;
  }
};
