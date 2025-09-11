
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { SalesforceIds } from '@/lib/salesforce-schemas';
import { leadSchema } from '@/lib/schemas';

// For this step, no fields are required from the user, but we define an empty schema for consistency.
const emissionSchema = z.object({
    policyNumber: z.string().optional(), // No user input needed, but keep for structure.
});

type EmissionFormValues = z.infer<typeof emissionSchema>;

interface EmissionFormProps {
  onSubmit: (data: EmissionFormValues) => void;
  onBack: () => void;
  initialData: Partial<EmissionFormValues>;
  isSubmitting: boolean;
  salesforceIds: SalesforceIds | null;
  buildPreviewPayload: (data: any, isFinalStep: boolean) => any;
}

const EmissionForm = ({ onSubmit, onBack, initialData, isSubmitting, salesforceIds, buildPreviewPayload }: EmissionFormProps) => {
  const form = useForm<EmissionFormValues>({
    resolver: zodResolver(emissionSchema),
    defaultValues: {
      policyNumber: initialData.policyNumber || '',
    },
    mode: 'onChange',
  });

  const watchedData = form.watch();
  
  // Construct the preview payload for the final update.
  const finalPayloadPreview = buildPreviewPayload({ ...watchedData, id: salesforceIds?.id }, true);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Emisión de la Póliza</h2>
          <p className="text-muted-foreground mb-6">
              Se generará un número de póliza automáticamente. Haga clic en el botón para finalizar la conversión del Lead a una Oportunidad en Salesforce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Póliza (se generará automáticamente)</FormLabel>
                  <FormControl>
                    <Input placeholder="Se generará al finalizar" {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>


        <div className="space-y-2">
            <label className="text-sm font-medium">Payload Final de Actualización (Vista Previa)</label>
            <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                {JSON.stringify(finalPayloadPreview, null, 2)}
            </pre>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Atrás
          </Button>
          <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'FINALIZAR Y CONVERTIR'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default EmissionForm;
