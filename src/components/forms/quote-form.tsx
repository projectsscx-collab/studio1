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
  });
  
  const currentValues = form.watch();
  
  const finalData = { ...initialData, ...currentValues };

  const leadPayload = {
    leadWrappers: [
        {
            firstName: finalData.firstName,
            lastName: finalData.lastName,
            documentType: finalData.documentType,
            documentNumber: finalData.documentNumber,
            birthdate: finalData.birthdate,
            contactData: {
                mobilePhone: finalData.mobilePhone,
                phone: finalData.phone,
                email: finalData.email,
            },
            interestProduct: {
                businessLine: "01",
                sector: "XX_01",
                subsector: "XX_00",
                branch: "XX_205",
                risk: JSON.stringify({
                    "Número de matrícula__c": finalData.numero_de_matricula,
                    "Marca__c": finalData.marca,
                    "Modelo__c": finalData.modelo,
                    "Año del vehículo__c": finalData.ano_del_vehiculo,
                    "Número de serie__c": finalData.numero_de_serie
                }),
                quotes: [
                    {
                        id: "TestWSConvertMIN",
                        effectiveDate: finalData.effectiveDate,
                        expirationDate: finalData.expirationDate,
                        productCode: "PRD001",
                        productName: "Life Insurance",
                        netPremium: 1000.00,
                        paymentMethod: finalData.paymentMethod,
                        isSelected: true,
                        paymentPeriodicity: finalData.paymentPeriodicity,
                        paymentTerm: finalData.paymentTerm,
                        additionalInformation: "test"
                    }
                ]
            },
            utmData: {
                utmCampaign: "ROPO_Auto"
            },
            sourceData: {
                sourceEvent: "01",
                eventReason: "01",
                sourceSite: "Website",
                deviceType: "01",
                deviceModel: "iPhone",
                leadSource: "01",
                origin: "01",
                systemOrigin: "05",
                ipData: {}
            },
        },
    ],
  };


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
            <h2 className="text-xl font-semibold">Detalles de la Cotización</h2>
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
                                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
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
                  <label className="text-sm font-medium">JSON a Enviar</label>
                  <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                      {JSON.stringify(leadPayload, null, 2)}
                  </pre>
              </div>
        </div>
        <div className="flex justify-between mt-12">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
            <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default QuoteForm;
