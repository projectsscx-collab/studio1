
import { cn } from '@/lib/utils';
import { User, Car, FileText, Handshake, CheckCircle } from 'lucide-react';

interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
    { number: 1, title: 'Datos Personales', icon: User },
    { number: 2, title: 'Datos del Vehículo', icon: Car },
    { number: 3, title: 'Contacto', icon: Handshake },
    { number: 4, title: 'Cotización', icon: FileText },
    { number: 5, title: 'Emisión', icon: CheckCircle },
];

const FormStepper = ({ currentStep, totalSteps }: FormStepperProps) => {
  if(currentStep > totalSteps) return null;

  return (
    <div className="flex items-center justify-center space-x-2">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center px-4 py-2 rounded-md border-2 transition-all duration-300',
              currentStep === step.number ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-300 text-gray-500',
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
