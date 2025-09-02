'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SubmissionConfirmationProps {
  onStartOver: () => void;
  response: any;
}

const SubmissionConfirmation = ({ onStartOver, response }: SubmissionConfirmationProps) => {
  const operationId = response?.leadWrappers?.[0]?.idFullOperation;

  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="p-3 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Solicitud enviada exitosamente!</h2>
        <p className="text-muted-foreground mb-6">
          Gracias por completar el formulario. Hemos recibido su información.
        </p>
        
        {operationId && (
          <Card className="w-full max-w-md my-4 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg text-green-800">Detalles de la Confirmación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">ID de Operación:</span>
                <span className="font-mono text-green-700 bg-green-100 px-2 py-1 rounded-md">{operationId}</span>
              </div>
            </CardContent>
          </Card>
        )}

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
