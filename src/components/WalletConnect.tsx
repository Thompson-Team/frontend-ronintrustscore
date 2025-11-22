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
      // Simular conexión con Ronin Wallet
      // En producción, usarías la librería de Ronin Wallet
      if (typeof (window as any).ronin === 'undefined') {
        toast({
          title: 'Wallet no encontrada',
          description: 'Por favor instala Ronin Wallet para continuar',
          variant: 'destructive'
        });
        setConnecting(false);
        return;
      }

      // Simular obtención de dirección (mock)
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      const mockSignature = 'mock_signature';

      await connectWallet(mockAddress, mockSignature);
      
      toast({
        title: 'Wallet conectada',
        description: 'Tu wallet ha sido conectada exitosamente',
      });

      onConnect(mockAddress);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo conectar la wallet',
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
      {connecting ? 'Conectando...' : 'Conectar Ronin Wallet'}
    </Button>
  );
};
