
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import type { SalesforceIds } from '@/lib/salesforce-schemas';
import { useEffect } from 'react';

interface EmissionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
  salesforceIds: SalesforceIds | null;
  buildPreviewPayload: (data: any, isFinalStep: boolean) => any;
}

const EmissionForm = ({ onSubmit, onBack, initialData, isSubmitting, salesforceIds, buildPreviewPayload }: EmissionFormProps) => {
  const form = useForm({
    resolver: zodResolver(leadSchema.pick({
      Amount: true,
      policyNumber: true,
    })),
    defaultValues: {
      Amount: initialData.Amount || 1000,
      policyNumber: initialData.policyNumber || '',
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    // Pre-fill policyNumber with Lead ID when the component mounts and if the field is empty.
    if (salesforceIds?.id && !form.getValues('policyNumber')) {
      form.setValue('policyNumber', salesforceIds.id, { shouldValidate: true });
    }
  }, [salesforceIds, form]);

  const watchedData = form.watch();
  
  // Construct the full preview payload by combining all existing data with the current form's data
  // Pass true to indicate this is the final step for the preview.
  const finalPayloadPreview = buildPreviewPayload(watchedData, true);


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Emisión de la Póliza</h2>
          <p className="text-muted-foreground mb-6">
              Confirme los detalles finales para emitir la póliza. El número de póliza se asignará automáticamente si se deja en blanco.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="Amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Importe (Amount)</FormLabel>
                    <FormControl>
                        <Input type="number" readOnly {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
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
                        <Input placeholder="Se autocompletará con el ID de Lead" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Payload Final a Enviar (Actualización de Lead)</label>
            <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                {JSON.stringify(finalPayloadPreview, null, 2)}
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
    
