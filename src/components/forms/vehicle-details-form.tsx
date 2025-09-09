'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface VehicleDetailsFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  buildPreviewPayload: (data: any) => any;
}

const VehicleDetailsForm = ({ onSubmit, onBack, initialData, buildPreviewPayload }: VehicleDetailsFormProps) => {
  const form = useForm({
    resolver: zodResolver(leadSchema.pick({
        numero_de_matricula: true,
        marca: true,
        modelo: true,
        ano_del_vehiculo: true,
        numero_de_serie: true,
    })),
    defaultValues: {
      ...initialData
    },
    mode: 'onChange',
  });

  const watchedData = form.watch();
  const previewPayload = buildPreviewPayload(watchedData);


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold mb-6">Datos del Vehículo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="numero_de_matricula"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número de Matrícula</FormLabel>
                        <FormControl><Input placeholder="E.g. 1234ABC" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl><Input placeholder="E.g. Toyota" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl><Input placeholder="E.g. Corolla" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="ano_del_vehiculo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Año del Vehículo</FormLabel>
                        <FormControl><Input placeholder="E.g. 2020" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="numero_de_serie"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número de Serie</FormLabel>
                        <FormControl><Input placeholder="E.g. 123456789" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-sm font-medium">Estado actual del formulario (Vista Previa)</label>
            <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                {JSON.stringify(previewPayload, null, 2)}
            </pre>
        </div>
        <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>Atrás</Button>
            <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={!form.formState.isValid}>
            CONTINUAR >
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default VehicleDetailsForm;
