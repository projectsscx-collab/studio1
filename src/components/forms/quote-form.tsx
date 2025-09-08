'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, paymentMethods, paymentPeriodicities, paymentTerms } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Input } from '../ui/input';

interface QuoteFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const QuoteForm = ({ onSubmit, onBack, initialData, isSubmitting }: QuoteFormProps) => {
  const form = useForm({
    resolver: zodResolver(leadSchema.pick({
        effectiveDate: true,
        expirationDate: true,
        paymentMethod: true,
        paymentPeriodicity: true,
        paymentTerm: true,
    })),
    defaultValues: {
        ...initialData,
        netPremium: '1000.00',
    },
    mode: 'onChange'
  });
  
  const currentValues = form.watch();
  const fullData = { ...initialData, ...currentValues };
  
  // This payload is just for display purposes
  const leadPayload = {
      leadWrappers: [{
        firstName: fullData.firstName,
        lastName: fullData.lastName,
        birthdate: fullData.birthdate,
        // ... all other data from previous steps
      }],
    };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold mb-6">Detalles de la Cotización</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="effectiveDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Efectividad</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn('w-[240px] justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Seleccione una fecha</span>}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    captionLayout="dropdown-buttons"
                                    fromYear={new Date().getFullYear()}
                                    toYear={new Date().getFullYear() + 10}
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => {
                                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                        if (date) {
                                            const expiration = new Date(date);
                                            expiration.setFullYear(expiration.getFullYear() + 1);
                                            form.setValue('expirationDate', format(expiration, 'yyyy-MM-dd'), { shouldValidate: true });
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Expiración</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn('w-[240px] justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Seleccione una fecha</span>}
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    captionLayout="dropdown-buttons"
                                    fromYear={new Date().getFullYear()}
                                    toYear={new Date().getFullYear() + 10}
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                    initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormItem>
                    <FormLabel>Prima Neta</FormLabel>
                    <FormControl>
                        <Input readOnly value="1000.00" />
                    </FormControl>
                </FormItem>
                <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un método" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {Object.entries(paymentMethods).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="paymentPeriodicity"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Periodicidad de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una periodicidad" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {Object.entries(paymentPeriodicities).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="paymentTerm"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Plazo de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un plazo" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {Object.entries(paymentTerms).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
             <div className="space-y-2 pt-4">
                <label className="text-sm font-medium">Datos Acumulados (Paso 3)</label>
                <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto max-h-96">
                    {JSON.stringify(fullData, null, 2)}
                </pre>
            </div>
        </div>
        
        <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
            <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONTINUAR >'}
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default QuoteForm;
