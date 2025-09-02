'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleUsageSchema, type VehicleUsageData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VehicleUsageFormProps {
  onSubmit: (data: VehicleUsageData) => void;
  initialData: Partial<VehicleUsageData>;
}

const VehicleUsageForm = ({ onSubmit, initialData }: VehicleUsageFormProps) => {
  const form = useForm<VehicleUsageData>({
    resolver: zodResolver(vehicleUsageSchema),
    defaultValues: {
        isPrincipalDriver: '',
        hasInsuranceAgent: '',
        ...initialData,
    },
    mode: 'onChange',
  });
  const { handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-xl font-semibold mb-6">¿Quién usaría el vehículo?</h2>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="isPrincipalDriver"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>¿Serás el conductor principal? <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="SI" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="yes">SI</SelectItem>
                                <SelectItem value="no">NO</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <FormField
                    control={form.control}
                    name="hasInsuranceAgent"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>¿Tienes agente de seguros?</FormLabel>
                        <FormControl>
                            <Input placeholder="Busque su agente de seguros aquí." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default VehicleUsageForm;
