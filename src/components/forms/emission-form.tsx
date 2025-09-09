'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
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
  
  const watchedData = form.watch();
  const currentFormData = { ...initialData, ...watchedData };

  const finalPayload = {
      leadWrappers: [{
          ...currentFormData,
          policyNumber: currentFormData.id || '', // Use lead ID for policyNumber
      }]
  }


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Emisión de la Póliza</h2>
          <p className="text-muted-foreground mb-6">
              Si está de acuerdo con la información introducida, pulse "Emitir".
          </p>
          
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
             {/* This field is now completely hidden from the UI */}
             <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                    <FormItem className="hidden">
                    <FormLabel>Número de Póliza</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Payload Final a Enviar (Vista Previa)</label>
            <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                {JSON.stringify(finalPayload, null, 2)}
            </pre>
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
