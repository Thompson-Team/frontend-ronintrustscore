import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletConnect } from '@/components/WalletConnect';
import { Shield, Sparkles, Lock, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    navigate('/questionnaire', { state: { walletAddress: address } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Powered by Ronin Network
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Reputation Oracle
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your on-chain verifiable trust score. Enhance security and strengthen communities across the Ronin ecosystem.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Smart evaluation of your behavior and trustworthiness
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">On-Chain Verified</h3>
              <p className="text-sm text-muted-foreground">
                Your score is published in a Ronin smart contract
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Safer Communities</h3>
              <p className="text-sm text-muted-foreground">
                Reduce scams and strengthen trust in games and dApps
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6 p-12 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <h2 className="text-3xl font-bold">Start Your Evaluation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect your Ronin Wallet and complete the questionnaire to generate your Reputation Score
            </p>
            <WalletConnect onConnect={handleWalletConnect} />
            <p className="text-xs text-muted-foreground">
              The process takes approximately 5 minutes
            </p>
          </div>

          {/* Info Footer */}
          <div className="mt-16 text-center text-sm text-muted-foreground">
            <p>
              Your information is analyzed securely and transparently.
              <br />
              The generated score is immutable and verifiable by any dApp in the ecosystem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
