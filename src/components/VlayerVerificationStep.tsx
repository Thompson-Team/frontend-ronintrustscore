import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Twitter, Mail, AlertCircle } from 'lucide-react';
import { verifyTwitter, verifyGoogle } from '@/services/api';

interface VlayerVerificationStepProps {
  walletAddress: string;
  value: any;
  onChange: (value: any) => void;
}

interface VerificationState {
  twitter: {
    handle: string;
    verified: boolean;
    loading: boolean;
    error: string | null;
    followerCount?: number;
    proof?: string;
  };
  google: {
    email: string;
    verified: boolean;
    loading: boolean;
    error: string | null;
    vouchScore?: number;
    proof?: string;
  };
}

export const VlayerVerificationStep = ({ 
  walletAddress, 
  value, 
  onChange 
}: VlayerVerificationStepProps) => {
  const [state, setState] = useState<VerificationState>({
    twitter: {
      handle: value?.twitter?.handle || '',
      verified: value?.twitter?.verified || false,
      loading: false,
      error: null,
      followerCount: value?.twitter?.followerCount,
      proof: value?.twitter?.proof
    },
    google: {
      email: value?.google?.email || '',
      verified: value?.google?.verified || false,
      loading: false,
      error: null,
      vouchScore: value?.google?.vouchScore,
      proof: value?.google?.proof
    }
  });

  const handleTwitterVerify = async () => {
    if (!state.twitter.handle) return;

    setState(prev => ({
      ...prev,
      twitter: { ...prev.twitter, loading: true, error: null }
    }));

    try {
      const result = await verifyTwitter(walletAddress, state.twitter.handle);
      
      const newState = {
        ...state,
        twitter: {
          ...state.twitter,
          verified: result.verified,
          loading: false,
          followerCount: result.followerCount,
          proof: result.proof
        }
      };
      
      setState(newState);
      onChange({
        twitter: newState.twitter,
        google: newState.google
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        twitter: {
          ...prev.twitter,
          loading: false,
          error: error.message || 'Verification failed',
          verified: false
        }
      }));
    }
  };

  const handleGoogleVerify = async () => {
    if (!state.google.email) return;

    setState(prev => ({
      ...prev,
      google: { ...prev.google, loading: true, error: null }
    }));

    try {
      const result = await verifyGoogle(walletAddress, state.google.email);
      
      const newState = {
        ...state,
        google: {
          ...state.google,
          verified: result.verified,
          loading: false,
          vouchScore: result.vouchScore,
          proof: result.proof
        }
      };
      
      setState(newState);
      onChange({
        twitter: newState.twitter,
        google: newState.google
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        google: {
          ...prev.google,
          loading: false,
          error: error.message || 'Verification failed',
          verified: false
        }
      }));
    }
  };

  const allVerified = state.twitter.verified && state.google.verified;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Identity Verification with Vlayer
        </h2>
        <p className="text-muted-foreground">
          Verify your identity using Zero-Knowledge Proofs. Both verifications are required to continue.
        </p>
      </div>

      {/* Twitter Verification */}
      <div className="space-y-4 p-6 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Twitter className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Twitter Verification</h3>
          {state.twitter.verified && (
            <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="twitter-handle">Twitter Handle</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="twitter-handle"
                  placeholder="username"
                  value={state.twitter.handle}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    twitter: { ...prev.twitter, handle: e.target.value }
                  }))}
                  disabled={state.twitter.verified}
                  className="pl-7"
                />
              </div>
              <Button
                onClick={handleTwitterVerify}
                disabled={!state.twitter.handle || state.twitter.loading || state.twitter.verified}
                className="min-w-[100px]"
              >
                {state.twitter.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : state.twitter.verified ? (
                  'Verified ✓'
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>

          {state.twitter.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.twitter.error}</AlertDescription>
            </Alert>
          )}

          {state.twitter.verified && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Verified!</strong> Account has {state.twitter.followerCount} followers.
                <br />
                <span className="text-xs text-green-600 dark:text-green-400">
                  ZK Proof: {state.twitter.proof?.substring(0, 20)}...
                </span>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            • Requires at least 100 followers
            <br />
            • Uses Zero-Knowledge Proofs via Vlayer
          </p>
        </div>
      </div>

      {/* Google Verification */}
      <div className="space-y-4 p-6 border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Google Verification with Vouch</h3>
          {state.google.verified && (
            <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="google-email">Google Email</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="google-email"
                type="email"
                placeholder="your.email@gmail.com"
                value={state.google.email}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  google: { ...prev.google, email: e.target.value }
                }))}
                disabled={state.google.verified}
                className="flex-1"
              />
              <Button
                onClick={handleGoogleVerify}
                disabled={!state.google.email || state.google.loading || state.google.verified}
                className="min-w-[100px]"
              >
                {state.google.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : state.google.verified ? (
                  'Verified ✓'
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>

          {state.google.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.google.error}</AlertDescription>
            </Alert>
          )}

          {state.google.verified && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Verified!</strong> Vouch Score: {state.google.vouchScore}/100
                <br />
                <span className="text-xs text-green-600 dark:text-green-400">
                  ZK Proof: {state.google.proof?.substring(0, 20)}...
                </span>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            • Verifies Google account ownership
            <br />
            • Uses Vouch protocol with ZK Proofs via Vlayer
          </p>
        </div>
      </div>

      {/* Overall Status */}
      {allVerified && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>All verifications completed!</strong> You can now proceed to the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};