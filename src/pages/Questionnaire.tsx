import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuestionStep } from '@/components/QuestionStep';
import { questions } from '@/lib/questions';
import { submitQuestionnaire } from '@/services/api';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const walletAddress = location.state?.walletAddress;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);


  if (!walletAddress) {
    navigate('/');
    return null;
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastQuestion = currentStep === questions.length - 1;
  const canProceed =
    answers[currentQuestion.id] !== undefined &&
    answers[currentQuestion.id] !== '';

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const questionnaireData: QuestionnaireResponse = {
        walletAddress,
        answers: answers,
      };

      const result = await submitQuestionnaire(questionnaireData);

      toast({
        title: 'Questionnaire submitted',
        description: 'Your response is being analyzed...',
      });

      navigate('/results', { state: { score: result, walletAddress } });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Your questionnaire could not be processed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Reputation Questionnaire</h1>
              <span className="text-sm text-muted-foreground">
                Question {currentStep + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <div className="bg-card border border-border rounded-xl p-8 mb-6 min-h-[400px]">
            <QuestionStep
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={handleAnswer}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
                className="gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit'}
                <Send className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Wallet Info */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Connected Wallet:</span>{' '}
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
