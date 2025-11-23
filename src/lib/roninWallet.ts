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

interface ChainConfig {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export class RoninWalletService {
  private provider: RoninWalletProvider | null = null;
  private accountsChangedHandlers: Array<(accounts: string[]) => void> = [];
  private chainChangedHandlers: Array<(chainId: string) => void> = [];

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
  getProvider(): RoninWalletProvider | null {
    if (!this.isInstalled()) {
      return null;
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
    
    if (!provider) {
      throw new Error('Ronin Wallet is not installed. Please install it from https://wallet.roninchain.com/');
    }
    
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
    
    if (!provider) {
      return [];
    }
    
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

    if (!provider) {
      throw new Error('Ronin Wallet is not installed');
    }

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

    if (!provider) {
      throw new Error('Ronin Wallet is not installed');
    }

    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    return balance;
  }

  /**
   * Obtiene la chain ID actual
   */
  async getChainId(): Promise<number> {
    const provider = this.getProvider();

    if (!provider) {
      throw new Error('Ronin Wallet is not installed');
    }

    const chainId = await provider.request({
      method: 'eth_chainId'
    });

    // Convertir hex a decimal
    return parseInt(chainId, 16);
  }

  /**
   * Cambia a una red específica
   */
  async switchChain(chainId: number): Promise<void> {
    const provider = this.getProvider();

    if (!provider) {
      throw new Error('Ronin Wallet is not installed');
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      // Si la red no está agregada (error 4902), lanzar el error para manejarlo
      if (error.code === 4902) {
        throw error;
      }
      
      if (error.code === 4001) {
        throw new Error('User rejected the network switch request');
      }
      
      throw new Error(error.message || 'Failed to switch network');
    }
  }

  /**
   * Agrega una nueva red a la wallet
   */
  async addChain(config: ChainConfig): Promise<void> {
    const provider = this.getProvider();

    if (!provider) {
      throw new Error('Ronin Wallet is not installed');
    }

    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${config.chainId.toString(16)}`,
            chainName: config.chainName,
            nativeCurrency: config.nativeCurrency,
            rpcUrls: config.rpcUrls,
            blockExplorerUrls: config.blockExplorerUrls,
          }
        ]
      });
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected adding the network');
      }
      throw new Error(error.message || 'Failed to add network');
    }
  }

  /**
   * Detecta cambios de cuenta
   */
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    const provider = this.getProvider();
    
    if (!provider) {
      console.warn('Ronin Wallet is not installed');
      return;
    }

    this.accountsChangedHandlers.push(callback);
    
    if (provider.on) {
      provider.on('accountsChanged', callback);
    }
  }

  /**
   * Detecta cambios de red
   */
  onChainChanged(callback: (chainId: string) => void): void {
    const provider = this.getProvider();
    
    if (!provider) {
      console.warn('Ronin Wallet is not installed');
      return;
    }

    this.chainChangedHandlers.push(callback);
    
    if (provider.on) {
      provider.on('chainChanged', callback);
    }
  }

  /**
   * Desconectar listeners
   */
  removeAllListeners(): void {
    const provider = this.getProvider();
    
    if (!provider?.removeListener) {
      return;
    }

    // Remover todos los handlers de accountsChanged
    this.accountsChangedHandlers.forEach(handler => {
      provider.removeListener!('accountsChanged', handler);
    });
    this.accountsChangedHandlers = [];

    // Remover todos los handlers de chainChanged
    this.chainChangedHandlers.forEach(handler => {
      provider.removeListener!('chainChanged', handler);
    });
    this.chainChangedHandlers = [];
  }

  /**
   * Desconecta la wallet (limpia el estado local)
   */
  disconnect(): void {
    this.removeAllListeners();
    this.provider = null;
  }
}

export const roninWallet = new RoninWalletService();