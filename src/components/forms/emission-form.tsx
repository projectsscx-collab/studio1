'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { documentTypes, paymentMethods, paymentPeriodicities, paymentTerms } from '@/lib/schemas';

interface EmissionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const EmissionForm = ({ onSubmit, onBack, initialData, isSubmitting }: EmissionFormProps) => {
  const form = useForm({
    defaultValues: {
      ...initialData,
      convertedStatus: '01' // Set the value to be sent on submit
    },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Revisión y Emisión de Póliza</CardTitle>
            <CardDescription>
              Por favor, revise la información de su cotización. Si todo es correcto, pulse "Emitir" para finalizar el proceso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalles de la Cotización</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border rounded-md">
                    <p><strong>Fecha de Efectividad:</strong> {initialData.effectiveDate}</p>
                    <p><strong>Fecha de Expiración:</strong> {initialData.expirationDate}</p>
                    <p><strong>Prima Neta:</strong> 1000.00</p>
                    <p><strong>Método de Pago:</strong> {paymentMethods[initialData.paymentMethod] || 'N/A'}</p>
                    <p><strong>Periodicidad de Pago:</strong> {paymentPeriodicities[initialData.paymentPeriodicity] || 'N/A'}</p>
                    <p><strong>Plazo de Pago:</strong> {paymentTerms[initialData.paymentTerm] || 'N/A'}</p>
                </div>
            </div>

             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Información Personal</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border rounded-md">
                    <p><strong>Nombre Completo:</strong> {initialData.firstName} {initialData.lastName}</p>
                    <p><strong>Documento:</strong> {documentTypes[initialData.documentType] || 'N/A'} - {initialData.documentNumber}</p>
                    <p><strong>Fecha de Nacimiento:</strong> {initialData.birthdate}</p>
                    <p><strong>Email:</strong> {initialData.email}</p>
                    <p><strong>Teléfono Móvil:</strong> {initialData.mobilePhone}</p>
                    <p><strong>Teléfono:</strong> {initialData.phone}</p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Datos del Vehículo</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border rounded-md">
                    <p><strong>Nº de Matrícula:</strong> {initialData.numero_de_matricula}</p>
                    <p><strong>Marca:</strong> {initialData.marca}</p>
                    <p><strong>Modelo:</strong> {initialData.modelo}</p>
                    <p><strong>Año:</strong> {initialData.ano_del_vehiculo}</p>
                    <p><strong>Nº de Serie:</strong> {initialData.numero_de_serie}</p>
                </div>
            </div>

          </CardContent>
          <div className="flex justify-between pt-8">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
            <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Procesando...' : 'Emitir'}
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EmissionForm;
