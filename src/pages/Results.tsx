import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { publishScoreOnChain } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ReputationScore } from '@/types/questionnaire';
import { Shield, CheckCircle2, ExternalLink, Home } from 'lucide-react';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const score: ReputationScore = location.state?.score;
  const walletAddress: string = location.state?.walletAddress;

  if (!score || !walletAddress) {
    navigate('/');
    return null;
  }

  const handlePublish = async () => {
    setPublishing(true);

    try {
      const result = await publishScoreOnChain(score);
      setTxHash(result.txHash);

      toast({
        title: 'Score published',
        description: 'Your Reputation Score has been successfully published on the Ronin blockchain',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'The score could not be published on-chain',
        variant: 'destructive'
      });
    } finally {
      setPublishing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Your Reputation Score</h1>
            <p className="text-muted-foreground">
              Analysis completed for {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>

          {/* Score Card */}
          <Card className="p-8 mb-8 text-center">
            <div className="space-y-6">
              <div>
                <div className={`text-7xl font-bold ${getScoreColor(score.score)} mb-2`}>
                  {score.score}
                </div>
                <div className="text-2xl font-semibold text-muted-foreground">
                  / 100
                </div>
                <div className="mt-4 inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold">
                  {getScoreLabel(score.score)}
                </div>
              </div>

              {!txHash && (
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  size="lg"
                  className="gap-2"
                >
                  {publishing ? 'Publishing...' : 'Publish On-Chain'}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}

              {txHash && (
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Published on blockchain</span>
                </div>
              )}
            </div>
          </Card>

          {/* Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Score Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Trustworthiness</span>
                    <span className="font-semibold">{score.breakdown.trustworthiness}%</span>
                  </div>
                  <Progress value={score.breakdown.trustworthiness} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Security</span>
                    <span className="font-semibold">{score.breakdown.security}%</span>
                  </div>
                  <Progress value={score.breakdown.security} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Experience</span>
                    <span className="font-semibold">{score.breakdown.experience}%</span>
                  </div>
                  <Progress value={score.breakdown.experience} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Behavior</span>
                    <span className="font-semibold">{score.breakdown.behavior}%</span>
                  </div>
                  <Progress value={score.breakdown.behavior} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-mono">{new Date(score.timestamp).toLocaleString()}</div>
                </div>

                <div>
                  <span className="text-muted-foreground">Wallet:</span>
                  <div className="font-mono break-all">{walletAddress}</div>
                </div>

                {txHash && (
                  <div>
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <div className="font-mono text-xs break-all">{txHash}</div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your score is now available for guilds, games, and dApps in the Ronin ecosystem
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Results;