'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactDetailsSchema, type ContactDetailsData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ContactDetailsFormProps {
  onSubmit: (data: ContactDetailsData) => void;
  initialData: Partial<ContactDetailsData>;
}

const ContactDetailsForm = ({ onSubmit, initialData }: ContactDetailsFormProps) => {
  const form = useForm<ContactDetailsData>({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues: {
      email: '',
      confirmEmail: '',
      phone: '',
      ...initialData,
    },
    mode: 'onChange',
  });
  const { handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-xl font-semibold mb-6">¿Cómo podemos contactarte?</h2>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>¿Cuál es tu correo electrónico? <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirma tu correo electrónico <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem className="max-w-xs">
                    <FormLabel>¿Cuál es tu número telefónico? <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
      </form>
    </FormProvider>
  );
};

export default ContactDetailsForm;
