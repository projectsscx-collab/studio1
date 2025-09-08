'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, sourceEvents, agentTypes } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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

  const currentValues = form.watch();
  const fullData = { ...initialData, ...currentValues };
  
  let utmCampaign = 'ROPO_Auto';
  if (fullData.agentType === 'APM') {
      utmCampaign = 'ROPO_APMCampaign';
  } else if (fullData.agentType === 'ADM') {
      utmCampaign = 'ROPO_ADMCampaign';
  }
  
  const updatePayload: any = {
      leadWrappers: [{
          // Data from previous steps
          firstName: fullData.firstName,
          lastName: fullData.lastName,
          birthdate: fullData.birthdate,
          documentType: fullData.documentType,
          documentNumber: fullData.documentNumber,
          contactData: {
              mobilePhone: fullData.mobilePhone,
              phone: fullData.phone,
              email: fullData.email,
          },
          interestProduct: {
              businessLine: '01',
              sector: 'XX_01',
              subsector: 'XX_00',
              branch: 'XX_205',
              risk: JSON.stringify({
                  'Número de matrícula__c': fullData.numero_de_matricula,
                  'Marca__c': fullData.marca,
                  'Modelo__c': fullData.modelo,
                  'Año del vehículo__c': fullData.ano_del_vehiculo,
                  'Número de serie__c': fullData.numero_de_serie,
              }),
              quotes: [{
                  id: 'TestWSConvertMIN',
                  effectiveDate: fullData.effectiveDate,
                  expirationDate: fullData.expirationDate,
                  productCode: 'PRD001',
                  productName: 'Life Insurance',
                  netPremium: 1000.0,
                  paymentMethod: fullData.paymentMethod,
                  paymentPeriodicity: fullData.paymentPeriodicity,
                  paymentTerm: fullData.paymentTerm,
                  additionalInformation: 'test',
                  isSelected: true,
              }],
          },
          sourceData: {
              sourceEvent: fullData.sourceEvent,
              eventReason: '01',
              sourceSite: 'Website',
              deviceType: '01',
              deviceModel: 'iPhone',
              leadSource: '01',
              origin: '01',
              systemOrigin: '05', 
              ipData: {},
          },
          utmData: {
              utmCampaign: utmCampaign,
          },
      }],
  };
  
  const leadWrapper = updatePayload.leadWrappers[0];

  if (fullData.agentType === 'APM') {
      leadWrapper.sourceData.systemOrigin = '02';
      leadWrapper.sourceData.origin = '02';
      leadWrapper.sourceData.leadSource = '02';
  } else if (fullData.agentType === 'ADM') {
      leadWrapper.sourceData.systemOrigin = '06';
      leadWrapper.sourceData.origin = '02';
      leadWrapper.sourceData.leadSource = '10';
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Preferencia de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

                <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium">JSON a Enviar (Actualización 1)</label>
                    <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto max-h-96">
                        {JSON.stringify(updatePayload, null, 2)}
                    </pre>
                </div>
             </CardContent>
             <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
                <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'CONTINUAR >'}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default ContactPreferenceForm;
