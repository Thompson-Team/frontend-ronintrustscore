import { Question } from '@/types/questionnaire';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface QuestionStepProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  walletAddress?: string;
}

export const QuestionStep = ({ question, value, onChange, walletAddress }: QuestionStepProps) => {
  const renderInput = () => {
    switch (question.type) {
      case 'multiple':
        return (
          <RadioGroup value={value} onValueChange={onChange}>
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'multiselect':
        const selectedValues = value || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="min-h-[120px]"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            min={1}
            max={10}
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={question.placeholder}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {question.question}
        </h2>
      </div>
      {renderInput()}
    </div>
  );
};
