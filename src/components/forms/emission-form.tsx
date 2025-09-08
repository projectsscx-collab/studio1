'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';
import { documentTypes, paymentMethods, paymentPeriodicities, paymentTerms } from '@/lib/schemas';


interface EmissionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const EmissionForm = ({ onSubmit, onBack, initialData, isSubmitting }: EmissionFormProps) => {
  const form = useForm({
    defaultValues: {},
  });

  const displayValue = (dict: Record<string, string>, key: string) => dict[key] || key;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Revisión y Emisión de la Póliza</CardTitle>
                <CardDescription>Por favor, revise que toda la información sea correcta antes de emitir la póliza. Esta acción es final.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Personal Details */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Datos Personales</h3>
                    <p><strong>Nombre Completo:</strong> {initialData.firstName} {initialData.lastName}</p>
                    <p><strong>Documento:</strong> {displayValue(documentTypes, initialData.documentType)} - {initialData.documentNumber}</p>
                    <p><strong>Fecha de Nacimiento:</strong> {format(new Date(initialData.birthdate), 'dd/MM/yyyy')}</p>
                    <p><strong>Email:</strong> {initialData.email}</p>
                    <p><strong>Teléfono:</strong> {initialData.phone}</p>
                </div>
                <hr/>
                 {/* Vehicle Details */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Datos del Vehículo</h3>
                    <p><strong>Matrícula:</strong> {initialData.numero_de_matricula}</p>
                    <p><strong>Marca y Modelo:</strong> {initialData.marca} {initialData.modelo}</p>
                    <p><strong>Año:</strong> {initialData.ano_del_vehiculo}</p>
                </div>
                 <hr/>
                {/* Quote Details */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Detalles de la Cotización</h3>
                     <p><strong>Fechas de Vigencia:</strong> {format(new Date(initialData.effectiveDate), 'dd/MM/yyyy')} - {format(new Date(initialData.expirationDate), 'dd/MM/yyyy')}</p>
                     <p><strong>Prima Neta:</strong> $1000.00</p>
                     <p><strong>Método de Pago:</strong> {displayValue(paymentMethods, initialData.paymentMethod)}</p>
                     <p><strong>Periodicidad:</strong> {displayValue(paymentPeriodicities, initialData.paymentPeriodicity)}</p>
                     <p><strong>Plazo:</strong> {displayValue(paymentTerms, initialData.paymentTerm)}</p>
                </div>

            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-4">
                 <p className="text-center text-sm text-muted-foreground">Si está de acuerdo con la información introducida pulse "Emitir".</p>
                 <div className="flex justify-between w-full">
                    <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
                    <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Emitir Póliza'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EmissionForm;
