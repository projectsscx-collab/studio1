
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { agentTypes, sourceEvents } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// 1. Define a clear and specific schema for this form step.
const contactPreferenceSchema = z.object({
  sourceEvent: z.string().min(1, 'Debe seleccionar cómo prefiere ser contactado.'),
  agentType: z.string().min(1, 'Debe seleccionar una preferencia de agente.'),
});

// 2. Define the type for the form values based on the schema.
type ContactPreferenceFormValues = z.infer<typeof contactPreferenceSchema>;

// 3. Define the props interface for the component.
interface ContactPreferenceFormProps {
  onSubmit: (data: ContactPreferenceFormValues) => void;
  onBack: () => void;
  initialData: Partial<ContactPreferenceFormValues>;
  isSubmitting: boolean;
}

// 4. Rewrite the component with a clean and standard structure.
const ContactPreferenceForm = ({ onSubmit, onBack, initialData, isSubmitting }: ContactPreferenceFormProps) => {
  const form = useForm<ContactPreferenceFormValues>({
    resolver: zodResolver(contactPreferenceSchema),
    defaultValues: {
      sourceEvent: initialData.sourceEvent || '',
      agentType: initialData.agentType || '',
    },
    mode: 'onChange', // Validate fields as soon as they change.
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">Preferencia de Contacto y Agente</h2>
          <p className="text-muted-foreground mb-6">
            Seleccione sus preferencias. Estos datos se incluirán en la creación del Lead.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="sourceEvent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Cómo prefieres que te contactemos?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(sourceEvents).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
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
                <FormItem>
                  <FormLabel>¿Quiere ser gestionado por un agente?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo de agente" />
                      </Trigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(agentTypes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Atrás
          </Button>
          <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONTINUAR >'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ContactPreferenceForm;
