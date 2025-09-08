'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, sourceEvents, agentTypes } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from 'lucide-react';

interface ContactPreferenceFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const ContactPreferenceForm = ({ onSubmit, onBack, initialData, isSubmitting }: ContactPreferenceFormProps) => {
  const form = useForm({
    resolver: zodResolver(leadSchema.pick({
        sourceEvent: true,
        agentType: true,
    })),
    defaultValues: {
      ...initialData,
    },
    mode: 'onChange',
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold mb-6">Preferencia de Contacto</h2>
            <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="sourceEvent"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>¿Cómo prefieres que te contactemos?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una opción" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {Object.entries(sourceEvents).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="agentType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>¿Quiere ser gestionado por un agente CC, APM o ADM?</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        {Object.entries(agentTypes).map(([key, value]) => (
                            <FormItem key={key} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value={key} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {value}
                                </FormLabel>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>
         <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
            <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONTINUAR >'}
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ContactPreferenceForm;
