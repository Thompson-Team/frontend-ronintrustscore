import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Trophy, 
  Shield, 
  TrendingUp, 
  User,
  ExternalLink,
  Loader2,
  Wallet as WalletIcon,
  AlertTriangle
} from 'lucide-react';
import { getUserScore } from '@/services/api';
import { roninWallet } from '@/lib/roninWallet';
import { ethers } from 'ethers';

interface ScoreBreakdown {
  trustworthiness: number;
  security: number;
  experience: number;
  behavior: number;
}

interface ProofData {
  proof: string;
  publicInputs: string;
  proofId: string;
  verified: boolean;
  compressed: boolean;
}

interface ReputationScore {
  score: number;
  walletAddress: string;
  timestamp: string;
  breakdown: ScoreBreakdown;
  proof?: ProofData & {
    txHash?: string;
  };
  nextStep?: {
    action: string;
    description: string;
    contractAddress: string;
    network: string;
  };
}

const ORACLE_ABI = [
  "function publishScore(bytes calldata proof, bytes calldata publicInputs) external",
  "function getScore(address user) external view returns (uint256 score, uint256 timestamp, bool verified)"
];

const RONIN_SAIGON_CHAIN_ID = 2021;

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [score, setScore] = useState<ReputationScore | null>(location.state?.score);
  const [loading, setLoading] = useState(false);
  const [onChainScore, setOnChainScore] = useState<ReputationScore | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isRoninInstalled, setIsRoninInstalled] = useState(false);

  const walletAddress = location.state?.walletAddress || score?.walletAddress;

  useEffect(() => {
    if (!score && !walletAddress) {
      navigate('/');
    }
  }, [score, walletAddress, navigate]);

  useEffect(() => {
    // Verificar si Ronin Wallet está instalada
    const installed = roninWallet.isInstalled();
    setIsRoninInstalled(installed);
    
    // Auto-detectar wallet si está disponible
    if (installed) {
      checkWalletConnection();
    }
  }, []);

  useEffect(() => {
    // Fetch on-chain score
    if (walletAddress) {
      fetchOnChainScore();
    }
  }, [walletAddress]);

  useEffect(() => {
    // Listeners para cambios en Ronin Wallet
    if (isRoninInstalled) {
      roninWallet.onAccountsChanged((accounts) => {
        if (accounts.length === 0) {
          setWallet(null);
        } else {
          setWallet(accounts[0]);
        }
      });

      roninWallet.onChainChanged(() => {
        window.location.reload();
      });
    }

    return () => {
      if (isRoninInstalled) {
        roninWallet.removeAllListeners();
      }
    };
  }, [isRoninInstalled]);

  const checkWalletConnection = async () => {
    try {
      const accounts = await roninWallet.getAccounts();
      if (accounts.length > 0) {
        setWallet(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);
      
      if (!isRoninInstalled) {
        setError('Ronin Wallet is not installed');
        window.open('https://wallet.roninchain.com/', '_blank');
        return;
      }

      // Conectar con Ronin Wallet
      const address = await roninWallet.connect();
      setWallet(address);

      // Verificar red
      const chainId = await roninWallet.getChainId();
      if (chainId !== RONIN_SAIGON_CHAIN_ID) {
        await switchToRoninSaigon();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to connect Ronin Wallet');
    }
  };

  const switchToRoninSaigon = async () => {
    try {
      await roninWallet.switchChain(RONIN_SAIGON_CHAIN_ID);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Intentar agregar la red si no existe
        await roninWallet.addChain({
          chainId: RONIN_SAIGON_CHAIN_ID,
          chainName: 'Ronin Saigon Testnet',
          nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
          rpcUrls: ['https://saigon-testnet.roninchain.com/rpc'],
          blockExplorerUrls: ['https://saigon-app.roninchain.com/'],
        });
      } else {
        throw switchError;
      }
    }
  };

  const fetchOnChainScore = async () => {
    setLoading(true);
    setError(null); // Limpiar error anterior
    try {
      const chainScore = await getUserScore(walletAddress);
      if (chainScore) {
        setOnChainScore(chainScore);
      } else {
        // No hay score publicado aún, esto es normal
        console.log('ℹ️ No on-chain score found, user needs to publish first');
      }
    } catch (error: any) {
      console.error('Error fetching on-chain score:', error);
      
      // Si el error es de red incorrecta, mostrar mensaje específico
      if (error.message.includes('Wrong network') || error.message.includes('Switched to')) {
        setError(error.message + ' Click "Refresh" to retry.');
      } else if (error.message.includes('No score found')) {
        // No mostrar error si simplemente no hay score
        console.log('ℹ️ No score found (this is normal before publishing)');
      } else {
        // Otros errores sí se muestran
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const publishScoreOnChain = async () => {
    try {
      setPublishLoading(true);
      setError(null);

      if (!score?.proof || !score.nextStep) {
        setError('No proof data available');
        return;
      }

      if (!wallet) {
        setError('Please connect your Ronin Wallet first');
        return;
      }

      // Obtener el provider de Ronin Wallet
      const provider = roninWallet.getProvider();
      if (!provider) {
        setError('Ronin Wallet provider not available');
        return;
      }

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const oracleContract = new ethers.Contract(
        score.nextStep.contractAddress,
        ORACLE_ABI,
        signer
      );

      // Convert to bytes
      const proofBytes = ethers.getBytes(score.proof.proof);
      const publicInputsBytes = ethers.getBytes(score.proof.publicInputs);

      // Verify address matches
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['address', 'uint256', 'uint256'],
        score.proof.publicInputs
      );

      if (decoded[0].toLowerCase() !== wallet.toLowerCase()) {
        setError('Address mismatch: This score belongs to a different wallet');
        return;
      }

      // Estimate gas
      const gasEstimate = await oracleContract.publishScore.estimateGas(
        proofBytes,
        publicInputsBytes
      );

      // Send transaction
      const tx = await oracleContract.publishScore(
        proofBytes,
        publicInputsBytes,
        { gasLimit: gasEstimate * 120n / 100n }
      );

      setTxHash(tx.hash);

      // Wait for confirmation
      await tx.wait();
      
      // Update score with tx hash
      setScore({
        ...score,
        proof: {
          ...score.proof,
          txHash: tx.hash
        }
      });

      // Fetch updated on-chain score
      await fetchOnChainScore();
    } catch (err: any) {
      let errorMessage = err.message;
      
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message.includes('Address mismatch')) {
        errorMessage = 'This score does not belong to your wallet';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient RON tokens for gas';
      }
      
      setError(errorMessage);
    } finally {
      setPublishLoading(false);
    }
  };

  if (!score) {
    return null;
  }

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getReputationLevel = (value: number) => {
    if (value >= 90) return 'Excellent';
    if (value >= 80) return 'Very Good';
    if (value >= 70) return 'Good';
    if (value >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const breakdownItems = [
    { label: 'Trustworthiness', value: score.breakdown.trustworthiness, icon: Shield },
    { label: 'Security', value: score.breakdown.security, icon: Shield },
    { label: 'Experience', value: score.breakdown.experience, icon: TrendingUp },
    { label: 'Behavior', value: score.breakdown.behavior, icon: User },
  ];

  const needsPublishing = !onChainScore && score.proof && !txHash;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Your Reputation Score</h1>
            <p className="text-muted-foreground">
              Verified on Ronin Blockchain with Zero-Knowledge Proofs
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="font-semibold">Error</div>
                <div className="text-sm">{error}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Ronin Wallet Not Installed Alert */}
          {!isRoninInstalled && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <div className="font-semibold mb-2">Ronin Wallet Required</div>
                <div className="text-sm mb-3">
                  You need Ronin Wallet installed to publish your score on-chain.
                </div>
                <Button 
                  onClick={() => window.open('https://wallet.roninchain.com/', '_blank')}
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                >
                  Install Ronin Wallet
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection Card */}
          {needsPublishing && isRoninInstalled && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <WalletIcon className="w-5 h-5" />
                Publish Your Score On-Chain
              </h3>
              
              {!wallet ? (
                <div className="space-y-4">
                  <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <div className="text-sm">
                        Connect your Ronin Wallet to publish your reputation score on the blockchain.
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={connectWallet}
                    className="w-full"
                  >
                    <WalletIcon className="w-4 h-4 mr-2" />
                    Connect Ronin Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <div className="font-semibold">Ronin Wallet Connected</div>
                      <div className="text-sm font-mono">
                        {wallet.slice(0, 10)}...{wallet.slice(-8)}
                      </div>
                    </AlertDescription>
                  </Alert>

                  {score.nextStep && (
                    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <div className="text-sm space-y-1">
                          <div className="font-semibold">Ready to Publish</div>
                          <div>{score.nextStep.description}</div>
                          <div className="text-xs pt-1">
                            <div>Network: {score.nextStep.network}</div>
                            <div>Contract: {score.nextStep.contractAddress.slice(0, 10)}...</div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={publishScoreOnChain}
                    disabled={publishLoading}
                    className="w-full"
                  >
                    {publishLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing On-Chain...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Publish Score to Blockchain
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Score Card */}
          <div className="bg-card border border-border rounded-xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(score.score)}`}>
                {score.score}
              </div>
              <div className="text-xl text-muted-foreground mb-4">
                {getReputationLevel(score.score)}
              </div>
              <Progress 
                value={score.score} 
                className="h-3"
              />
            </div>

            {/* ZK Proof Info */}
            {score.proof && (
              <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <div className="space-y-1">
                    <div className="font-semibold">✅ Verified with Zero-Knowledge Proof</div>
                    <div className="text-sm">
                      <div>Proof ID: {score.proof.proofId}</div>
                      <div>Status: {score.proof.verified ? 'Verified ✓' : 'Pending'}</div>
                      {score.proof.txHash && (
                        <div className="flex items-center gap-2 mt-1">
                          <span>Transaction:</span>
                          <a 
                            href={`https://saigon-app.roninchain.com/tx/${score.proof.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            {score.proof.txHash.slice(0, 10)}...{score.proof.txHash.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
              {breakdownItems.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(item.value)}`}>
                      {item.value}
                    </span>
                  </div>
                  <Progress 
                    value={item.value} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* On-Chain Verification */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">On-Chain Verification</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Checking blockchain...</span>
              </div>
            ) : onChainScore ? (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-1">
                    <div className="font-semibold">✅ Score Verified On-Chain</div>
                    <div className="text-sm">
                      Score: {onChainScore.score} | Last Updated: {new Date(onChainScore.timestamp).toLocaleString()}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : txHash ? (
              <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <div className="space-y-1">
                    <div className="font-semibold">⏳ Transaction Pending</div>
                    <div className="text-sm">
                      Your score is being confirmed on the blockchain...
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  <div className="text-sm">
                    {needsPublishing 
                      ? 'Ready to publish your score to the blockchain.'
                      : 'Your score will be available on-chain after publishing.'
                    }
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={fetchOnChainScore}
              variant="outline"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh On-Chain Status'
              )}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Back to Home
            </Button>
            <Button 
              onClick={() => {
                const url = `https://saigon-app.roninchain.com/address/${walletAddress}`;
                window.open(url, '_blank');
              }}
              className="flex-1"
            >
              View on Explorer
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Wallet Info */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-semibold">Wallet:</span>{' '}
              {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Results;