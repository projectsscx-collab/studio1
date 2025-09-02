'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

interface VehicleDetailsFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

const vehicleDetailsSchema = z.object({});

const VehicleDetailsForm = ({ onSubmit, onBack, initialData }: VehicleDetailsFormProps) => {
  const form = useForm({
    resolver: zodResolver(vehicleDetailsSchema),
    defaultValues: initialData,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
            <h2 className="text-xl font-semibold">Vehicle Details (Placeholder)</h2>
            <p>This is the second step.</p>
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

export default VehicleDetailsForm;
