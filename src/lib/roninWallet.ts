interface RoninWalletProvider {
  isRonin?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ronin?: {
      provider?: RoninWalletProvider;
    };
  }
}

export class RoninWalletService {
  private provider: RoninWalletProvider | null = null;

  /**
   * Detecta si Ronin Wallet está instalada
   */
  isInstalled(): boolean {
    return typeof window !== 'undefined' && 
           !!window.ronin?.provider?.isRonin;
  }

  /**
   * Obtiene el provider de Ronin
   */
  getProvider(): RoninWalletProvider {
    if (!this.isInstalled()) {
      throw new Error('Ronin Wallet is not installed. Please install it from https://wallet.roninchain.com/');
    }
    
    if (!this.provider) {
      this.provider = window.ronin!.provider!;
    }
    
    return this.provider;
  }

  /**
   * Conecta la wallet y solicita permisos
   */
  async connect(): Promise<string> {
    const provider = this.getProvider();
    
    try {
      // Solicitar acceso a la wallet
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      return accounts[0];
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }

  /**
   * Obtiene las cuentas conectadas
   */
  async getAccounts(): Promise<string[]> {
    const provider = this.getProvider();
    
    const accounts = await provider.request({
      method: 'eth_accounts'
    });

    return accounts || [];
  }

  /**
   * Firma un mensaje para verificación
   */
  async signMessage(address: string, message: string): Promise<string> {
    const provider = this.getProvider();

    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address]
      });

      return signature;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the signature request');
      }
      throw new Error(error.message || 'Failed to sign message');
    }
  }

  /**
   * Obtiene el balance de la wallet
   */
  async getBalance(address: string): Promise<string> {
    const provider = this.getProvider();

    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    return balance;
  }

  /**
   * Obtiene la chain ID actual
   */
  async getChainId(): Promise<string> {
    const provider = this.getProvider();

    const chainId = await provider.request({
      method: 'eth_chainId'
    });

    return chainId;
  }

  /**
   * Detecta cambios de cuenta
   */
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    const provider = this.getProvider();
    
    if (provider.on) {
      provider.on('accountsChanged', callback);
    }
  }

  /**
   * Detecta cambios de red
   */
  onChainChanged(callback: (chainId: string) => void): void {
    const provider = this.getProvider();
    
    if (provider.on) {
      provider.on('chainChanged', callback);
    }
  }

  /**
   * Desconectar listeners
   */
  removeAllListeners(): void {
    if (this.provider?.removeListener) {
      this.provider.removeListener('accountsChanged', () => {});
      this.provider.removeListener('chainChanged', () => {});
    }
  }
}

export const roninWallet = new RoninWalletService();
