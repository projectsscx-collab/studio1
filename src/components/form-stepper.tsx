import { cn } from '@/lib/utils';

interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
    { number: 1, title: 'Personal' },
    { number: 2, title: 'Contact' },
    { number: 3, title: 'Demographics' },
];

const FormStepper = ({ currentStep, totalSteps }: FormStepperProps) => {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                currentStep > step.number ? 'bg-primary border-primary text-primary-foreground' : '',
                currentStep === step.number ? 'bg-primary/20 border-primary text-primary' : '',
                currentStep < step.number ? 'bg-secondary border-border text-muted-foreground' : ''
              )}
            >
              <span className="font-bold">{step.number}</span>
            </div>
            <p className={cn(
                "mt-2 text-sm font-medium",
                currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
            )}>
                {step.title}
            </p>
          </div>
          {index < totalSteps -1 && (
             <div className={cn(
                "w-16 h-1 bg-border transition-colors duration-300 mx-4",
                currentStep > step.number ? "bg-primary" : ""
            )}></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormStepper;
