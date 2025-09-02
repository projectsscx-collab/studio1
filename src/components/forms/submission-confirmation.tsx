'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmissionConfirmationProps {
  onStartOver: () => void;
}

const SubmissionConfirmation = ({ onStartOver }: SubmissionConfirmationProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="p-3 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Solicitud enviada exitosamente!</h2>
        <p className="text-muted-foreground mb-6">
          Gracias por completar el formulario. Hemos recibido su información.
        </p>
        <p className="text-sm text-center text-muted-foreground mb-8">
          Recibirá un correo electrónico de confirmación en breve. Si tiene alguna pregunta, no dude en ponerse en contacto con nuestro equipo de soporte.
        </p>
        <Button onClick={onStartOver} size="lg" className="bg-lime-500 hover:bg-lime-600 text-black font-bold">
            Iniciar un nuevo formulario
        </Button>
    </div>
  );
};

export default SubmissionConfirmation;
