'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { documentTypes, paymentMethods, paymentPeriodicities, paymentTerms } from '@/lib/schemas';

interface EmissionFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting: boolean;
}

const EmissionForm = ({ onSubmit, onBack, initialData, isSubmitting }: EmissionFormProps) => {
  const form = useForm({
    defaultValues: {
      ...initialData,
      // Hardcode convertedStatus for the final submission
      convertedStatus: '01',
    },
  });

  const fullData = { ...initialData, convertedStatus: '01' };

  let utmCampaign = 'ROPO_Auto';
  let systemOrigin = '05';
  let origin = '01';
  let leadSource = '01';

  if (fullData.agentType === 'APM') {
      utmCampaign = 'ROPO_APMCampaign';
      systemOrigin = '02';
      origin = '02';
      leadSource = '02';
  } else if (fullData.agentType === 'ADM') {
      utmCampaign = 'ROPO_ADMCampaign';
      systemOrigin = '06';
      origin = '02';
      leadSource = '10';
  }
  
  const finalPayload: any = {
      leadWrappers: [{
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
              leadSource: leadSource,
              origin: origin,
              systemOrigin: systemOrigin, 
              ipData: {},
          },
          utmData: {
              utmCampaign: utmCampaign,
          },
          conversionData: {
              convertedStatus: fullData.convertedStatus
          }
      }],
  };
  
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold mb-6">Revisión y Emisión de Póliza</h2>
            <p className="text-muted-foreground mb-6">
                Por favor, revise la información de su cotización. Si todo es correcto, pulse "Emitir" para finalizar el proceso.
            </p>

            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Detalles de la Cotización</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm p-4 border rounded-md bg-gray-50/50">
                        <p><strong>Fecha de Efectividad:</strong> {initialData.effectiveDate}</p>
                        <p><strong>Fecha de Expiración:</strong> {initialData.expirationDate}</p>
                        <p><strong>Prima Neta:</strong> 1000.00</p>
                        <p><strong>Método de Pago:</strong> {paymentMethods[initialData.paymentMethod] || 'N/A'}</p>
                        <p><strong>Periodicidad de Pago:</strong> {paymentPeriodicities[initialData.paymentPeriodicity] || 'N/A'}</p>
                        <p><strong>Plazo de Pago:</strong> {paymentTerms[initialData.paymentTerm] || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Información Personal</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm p-4 border rounded-md bg-gray-50/50">
                        <p><strong>Nombre Completo:</strong> {initialData.firstName} {initialData.lastName}</p>
                        <p><strong>Documento:</strong> {documentTypes[initialData.documentType] || 'N/A'} - {initialData.documentNumber}</p>
                        <p><strong>Fecha de Nacimiento:</strong> {initialData.birthdate}</p>
                        <p><strong>Email:</strong> {initialData.email}</p>
                        <p><strong>Teléfono Móvil:</strong> {initialData.mobilePhone}</p>
                        <p><strong>Teléfono:</strong> {initialData.phone}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Datos del Vehículo</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm p-4 border rounded-md bg-gray-50/50">
                        <p><strong>Nº de Matrícula:</strong> {initialData.numero_de_matricula}</p>
                        <p><strong>Marca:</strong> {initialData.marca}</p>
                        <p><strong>Modelo:</strong> {initialData.modelo}</p>
                        <p><strong>Año:</strong> {initialData.ano_del_vehiculo}</p>
                        <p><strong>Nº de Serie:</strong> {initialData.numero_de_serie}</p>
                    </div>
                </div>
                 <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium">JSON Final a Enviar</label>
                    <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto max-h-96">
                        {JSON.stringify(finalPayload, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Atrás</Button>
          <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Emitiendo...' : 'Emitir Póliza'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default EmissionForm;
