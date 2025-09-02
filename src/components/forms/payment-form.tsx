'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const paymentSchema = z.object({});

const PaymentForm = ({ onSubmit, onBack, initialData, isSubmitting }: PaymentFormProps) => {
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
            <h2 className="text-xl font-semibold">Payment (Placeholder)</h2>
            <p>This is the final step before submission.</p>
             <div className="space-y-2 pt-4">
                  <label className="text-sm font-medium">JSON to Submit</label>
                  <pre className="p-4 bg-gray-100 rounded-md text-xs overflow-auto h-64">
                      {JSON.stringify(initialData, null, 2)}
                  </pre>
              </div>
        </div>
        <div className="flex justify-between mt-12">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
            <Button type="submit" size="lg" className="bg-lime-500 hover:bg-lime-600 text-black font-bold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default PaymentForm;
