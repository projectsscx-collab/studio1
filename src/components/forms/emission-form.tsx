'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
    },
    mode: 'onChange',
  });
  
  const allData = { ...initialData, ...form.watch() };

  const finalPayload = {
    idFullOperation: allData.idFullOperation,
    conversionData: {
        convertedStatus: allData.convertedStatus,
        policyNumber: allData.policyNumber,
    },
    idOwner: '005D700000GSRhDIAX',
    interestProduct: {
      quotes: [{
        id: 'TestWSConvertMIN',
        effectiveDate: allData.effectiveDate,
        expirationDate: allData.expirationDate,
        paymentMethod: allData.paymentMethod,
        paymentPeriodicity: allData.paymentPeriodicity,
        paymentTerm: allData.paymentTerm,
      }]
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Emisión de la Póliza</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="convertedStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de Conversión</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="01">Ganado</SelectItem>
                      <SelectItem value="02">Emitido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Póliza</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. POL123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">JSON a Enviar (Actualización/Emisión)</label>
            <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                {JSON.stringify(finalPayload, null, 2)}
            </pre>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Atrás
          </Button>
          <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'EMITIR PÓLIZA'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default EmissionForm;
