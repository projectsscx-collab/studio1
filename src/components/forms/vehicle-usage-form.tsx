'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VehicleUsageForm = () => {
  const form = useFormContext();

  return (
    <div>
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
    </div>
  );
};

export default VehicleUsageForm;
