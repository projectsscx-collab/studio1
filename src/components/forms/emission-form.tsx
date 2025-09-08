'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface EmissionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const EmissionForm = ({ onSubmit, onBack, initialData, isSubmitting }: EmissionFormProps) => {
  const form = useForm({
    resolver: zodResolver(leadSchema.pick({
      convertedStatus: true,
      policyNumber: true,
    })),
    defaultValues: {
      ...initialData,
      convertedStatus: '02', // Pre-select "Emitido"
    },
    mode: 'onChange',
  });
  
  const allData = { ...initialData, ...form.watch() };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Emisión de la Póliza</h2>
          <p className="text-muted-foreground mb-6">
              Si está de acuerdo con la información introducida, pulse "Emitir".
          </p>

          <Card className="mb-6">
            <CardHeader>
                <CardTitle>Resumen de Cotización</CardTitle>
                <CardDescription>Esta es la información que se utilizará para emitir su póliza.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Fecha de Efectividad:</span> {new Date(allData.effectiveDate).toLocaleDateString()}</div>
                    <div><span className="font-semibold">Fecha de Expiración:</span> {new Date(allData.expirationDate).toLocaleDateString()}</div>
                    <div><span className="font-semibold">Método de Pago:</span> {allData.paymentMethod}</div>
                    <div><span className="font-semibold">Periodicidad:</span> {allData.paymentPeriodicity}</div>
                    <div><span className="font-semibold">Plazo:</span> {allData.paymentTerm}</div>
                    <div><span className="font-semibold">Prima Neta:</span> 1000.00</div>
                </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* These fields are hidden as per the requirement but necessary for the submission */}
            <FormField
                control={form.control}
                name="convertedStatus"
                render={({ field }) => (
                    <FormItem className="hidden">
                    <FormLabel>Estado de Conversión</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Póliza (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. POL123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Atrás
          </Button>
          <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'EMITIR'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default EmissionForm;
