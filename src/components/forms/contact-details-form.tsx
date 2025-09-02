'use client';

import { useFormContext } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const ContactDetailsForm = () => {
  const form = useFormContext();

  return (
    <div>
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
    </div>
  );
};

export default ContactDetailsForm;
