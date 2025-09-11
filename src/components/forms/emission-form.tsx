
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { SalesforceIds } from '@/lib/salesforce-schemas';
import { useEffect } from 'react';

// Define a simple schema for this form as it has no user-editable fields.
const emissionSchema = z.object({});

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
    resolver: async (data) => ({ values: data, errors: {} }), // No validation needed
    defaultValues: {
      ...initialData,
      StageName: '02', // This is the only value we care about for the submission
    },
  });
  
  useEffect(() => {
    // This form might not need this anymore, but it's harmless
    if (salesforceIds?.id) {
       form.setValue('id', salesforceIds.id);
    }
  }, [salesforceIds, form]);

  const watchedData = form.watch();
  
  // Construct the preview payload for the final update.
  const finalPayloadPreview = buildPreviewPayload(watchedData, true);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Emisión de la Póliza</h2>
          <p className="text-muted-foreground mb-6">
              Haga clic en el botón de abajo para finalizar la conversión del Lead a una Oportunidad en Salesforce.
              Esto marcará el proceso como completado.
          </p>
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
    
