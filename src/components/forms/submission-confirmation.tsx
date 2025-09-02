'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SubmissionConfirmationProps {
  onStartOver: () => void;
  response: any;
}

const SubmissionConfirmation = ({ onStartOver, response }: SubmissionConfirmationProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="p-3 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Solicitud enviada exitosamente!</h2>
        <p className="text-muted-foreground mb-6">
          Gracias por completar el formulario. Hemos recibido su información.
        </p>
        
        {response && (
          <Card className="w-full max-w-2xl my-4 bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Respuesta de Salesforce</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-100 rounded-md text-xs text-left overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-center text-muted-foreground my-8">
          Recibirá un correo electrónico de confirmación en breve. Si tiene alguna pregunta, no dude en ponerse en contacto con nuestro equipo de soporte.
        </p>
        <Button onClick={onStartOver} size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold">
            Iniciar un nuevo formulario
        </Button>
    </div>
  );
};

export default SubmissionConfirmation;
