
'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { SalesforceIds } from '@/lib/salesforce-schemas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface SubmissionConfirmationProps {
  onStartOver: () => void;
  creationResponse: any;
  updateResponse: any;
  salesforceIds: SalesforceIds | null;
}

const SubmissionConfirmation = ({ onStartOver, creationResponse, updateResponse, salesforceIds }: SubmissionConfirmationProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="p-3 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Solicitud enviada exitosamente!</h2>
        <p className="text-muted-foreground mb-6">
          Gracias por completar el formulario. Hemos recibido y procesado su información.
        </p>
        
        {salesforceIds && (
             <Card className="w-full max-w-md my-4 text-left">
                <CardHeader>
                    <CardTitle>Referencia de su Operación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">ID de Lead:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{salesforceIds.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">ID de Operación Completa:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{salesforceIds.idFullOperation}</span>
                    </div>
                </CardContent>
            </Card>
        )}

        <Accordion type="single" collapsible className="w-full max-w-2xl my-4">
            {creationResponse && (
                <AccordionItem value="item-1">
                    <AccordionTrigger>Respuesta de Salesforce (Creación)</AccordionTrigger>
                    <AccordionContent>
                         <pre className="p-4 bg-gray-100 rounded-md text-xs text-left overflow-auto max-h-96">
                            {JSON.stringify(creationResponse, null, 2)}
                        </pre>
                    </AccordionContent>
                </AccordionItem>
            )}
            {updateResponse && (
                <AccordionItem value="item-2">
                    <AccordionTrigger>Respuesta de Salesforce (Actualización)</AccordionTrigger>
                    <AccordionContent>
                         <pre className="p-4 bg-gray-100 rounded-md text-xs text-left overflow-auto max-h-96">
                            {JSON.stringify(updateResponse, null, 2)}
                        </pre>
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>


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
    
