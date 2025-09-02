'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

interface QuoteFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

const quoteSchema = z.object({});

const QuoteForm = ({ onSubmit, onBack, initialData }: QuoteFormProps) => {
  const form = useForm({
    resolver: zodResolver(quoteSchema),
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
            <h2 className="text-xl font-semibold">Quote Details (Placeholder)</h2>
            <p>This is the third step.</p>
        </div>
        <div className="flex justify-between mt-12">
            <Button type="button" variant="outline" onClick={onBack}>Back</Button>
            <Button type="submit" size="lg" className="bg-lime-500 hover:bg-lime-600 text-black font-bold">
            CONTINUAR &gt;
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default QuoteForm;
