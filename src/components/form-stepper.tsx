import { cn } from '@/lib/utils';
import { User, Car, FileText, PenSquare, DollarSign } from 'lucide-react';

interface FormStepperProps {
  currentStep: number;
}

const steps = [
    { number: 1, title: 'Sobre ti', icon: User },
    { number: 2, title: 'Vehículo', icon: Car },
    { number: 3, title: 'Cotización', icon: FileText },
    { number: 4, title: 'Adicional', icon: PenSquare },
    { number: 5, title: 'Pagar', icon: DollarSign },
];

const FormStepper = ({ currentStep }: FormStepperProps) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center px-4 py-2 rounded-md border-2 transition-all duration-300',
              currentStep === step.number ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 text-gray-500',
            )}
          >
            <step.icon className="h-5 w-5 mr-2" />
            <span className="font-medium text-sm">{step.title}</span>
          </div>
          {index < steps.length - 1 && (
             <div className="w-10 h-px bg-gray-300 mx-2"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormStepper;