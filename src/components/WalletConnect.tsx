import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { roninWallet } from '@/lib/roninWallet';
import { connectWallet } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const WalletConnect = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si Ronin Wallet está instalada
    setIsInstalled(roninWallet.isInstalled());

    // Intentar obtener cuenta ya conectada
    if (roninWallet.isInstalled()) {
      checkExistingConnection();
    }

    // Listeners para cambios
    if (roninWallet.isInstalled()) {
      roninWallet.onAccountsChanged((accounts) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setAddress(accounts[0]);
        }
      });

      roninWallet.onChainChanged(() => {
        window.location.reload();
      });
    }

    return () => {
      if (roninWallet.isInstalled()) {
        roninWallet.removeAllListeners();
      }
    };
  }, []);

  const checkExistingConnection = async () => {
    try {
      const accounts = await roninWallet.getAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnect = async () => {
    if (!isInstalled) {
      window.open('https://wallet.roninchain.com/', '_blank');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // 1. Conectar wallet
      const walletAddress = await roninWallet.connect();
      setAddress(walletAddress);

      // 2. Crear mensaje para firmar
      const message = `Sign this message to verify your identity.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;

      // 3. Firmar mensaje
      const signature = await roninWallet.signMessage(walletAddress, message);

      // 4. Enviar al backend para verificación
      const response = await connectWallet(walletAddress, signature);

      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to Ronin Wallet',
      });

      // 5. Guardar token y navegar al cuestionario
      localStorage.setItem('auth_token', response.token);
      navigate('/questionnaire', { state: { walletAddress } });

    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setAddress(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    localStorage.removeItem('auth_token');
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isInstalled) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ronin Wallet is not installed. Please install it to continue.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={handleConnect}
          className="w-full"
          size="lg"
        >
          Install Ronin Wallet
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (address) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Connected:</strong> {formatAddress(address)}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/questionnaire', { state: { walletAddress: address } })}
            className="flex-1"
            size="lg"
          >
            Start Questionnaire
          </Button>
          <Button 
            onClick={handleDisconnect}
            variant="outline"
            size="lg"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleConnect}
        disabled={connecting}
        className="w-full"
        size="lg"
      >
        {connecting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5 mr-2" />
            Connect Ronin Wallet
          </>
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>Make sure you have Ronin Wallet installed</p>
        <a 
          href="https://wallet.roninchain.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          Download Ronin Wallet
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};