'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

interface AdditionalInfoFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

const additionalInfoSchema = z.object({});

const AdditionalInfoForm = ({ onSubmit, onBack, initialData }: AdditionalInfoFormProps) => {
  const form = useForm({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
            <h2 className="text-xl font-semibold">Additional Information (Placeholder)</h2>
            <p>This is the fourth step.</p>
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

export default AdditionalInfoForm;
