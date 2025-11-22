import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { connectWallet } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export const WalletConnect = ({ onConnect }: WalletConnectProps) => {
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setConnecting(true);

    try {
      if (typeof (window as any).ronin === 'undefined') {
        toast({
          title: 'Wallet not found',
          description: 'Please install Ronin Wallet to continue',
          variant: 'destructive'
        });
        setConnecting(false);
        return;
      }

      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      const mockSignature = 'mock_signature';

      await connectWallet(mockAddress, mockSignature);

      toast({
        title: 'Wallet connected',
        description: 'Your wallet has been successfully connected',
      });

      onConnect(mockAddress);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect wallet',
        variant: 'destructive'
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      size="lg"
      className="gap-2"
    >
      <Wallet className="w-5 h-5" />
      {connecting ? 'Connecting...' : 'Connect Ronin Wallet'}
    </Button>
  );
};
