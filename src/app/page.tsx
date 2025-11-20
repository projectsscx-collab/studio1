

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import PersonalDetailsForm from '@/components/forms/personal-details-form';
import VehicleDetailsForm from '@/components/forms/vehicle-details-form';
import QuoteForm from '@/components/forms/quote-form';
import ContactPreferenceForm from '@/components/forms/contact-preference-form';
import EmissionForm from '@/components/forms/emission-form';
import SubmissionConfirmation from '@/components/forms/submission-confirmation';
import FormStepper from '@/components/form-stepper';
import { submitLead } from '@/ai/flows/insert-lead-flow';
import type { FormData, SalesforceIds } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

const calculateUniqueId = (prefix = 'ID') => {
    if (prefix === 'POL') {
        // Generate a 6-digit numeric string for the policy number
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}${timestamp}${randomPart}`;
};

const initialFormData: FormData = {
  // --- Salesforce IDs ---
  id: null,
  idFullOperation: calculateUniqueId('IS'),

  // --- Step 1: Personal Details ---
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthdate: '',
  
  // Contact Data
  mobilePhone: '',
  phone: '',
  email: '',
  
  // Address is no longer collected
  street: 'N/A',
  postalCode: 'N/A',
  city: 'N/A',
  district: 'N/A',
  municipality: 'N/A',
  state: 'XX', 
  country: 'PR',

  // --- Step 2: Vehicle Details ---
  numero_de_matricula: '',
  marca: '',
  modelo: '',
  ano_del_vehiculo: '',
  numero_de_serie: '',
  
  // --- Step 3: Contact Preference ---
  agentType: 'CC', // Default to Contact Center
  sourceEvent: '01',
  UTMCampaign: '',

  // --- Step 4: Quote Details ---
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  
  // --- Step 5: Emission ---
  StageName: null, 
  CloseDate: null,
  Amount: 1000,
  isSelected: false,
  policyNumber: '',
};

const buildLeadPayload = (formData: FormData, isFinalUpdate = false) => {
    let sourceData: any = {
        sourceEvent: formData.sourceEvent,
        eventReason: "01",
        sourceSite: "Website",
        deviceType: "01",
        deviceModel: "iPhone",
        leadSource: "01", 
        origin: "02",
        systemOrigin: "06", 
        ipData: {}
    };

    let utmData: any = {};
    if (formData.agentType === 'CC') {
        utmData = { UTMCampaign: 'ROPO_CCCampaign' };
    } else if (formData.agentType === 'APM') {
        sourceData.systemOrigin = '02';
        sourceData.leadSource = '02';
    } else if (formData.agentType === 'ADM') {
        sourceData.leadSource = '10';
    }
    
    const riskObject = {
        'Número de matrícula__c': formData.numero_de_matricula,
        'Marca__c': formData.marca,
        'Modelo__c': formData.modelo,
        'Año del vehículo__c': formData.ano_del_vehiculo,
        'Número de serie__c': formData.numero_de_serie,
    };
    
    // Base properties for creation and update
    let leadWrapper: any = {
        idFullOperation: formData.idFullOperation,
        firstName: formData.firstName,
        lastName: formData.lastName,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        birthdate: formData.birthdate,
        contactData: {
            mobilePhone: formData.mobilePhone,
            phone: formData.phone,
            email: formData.email,
            address: {
              street: formData.street,
              postalCode: formData.postalCode,
              city: formData.city,
              district: formData.district,
              municipality: formData.municipality,
              state: formData.state,
              country: formData.country,
            }
        },
        utmData: utmData,
        sourceData: sourceData,
        interestProduct: {
            businessLine: "01",
            sector: "XX_01",
            subsector: "XX_00",
            branch: "XX_205",
            risk: JSON.stringify(riskObject),
            quotes: [{
                id: calculateUniqueId('QT'),
                effectiveDate: formData.effectiveDate,
                expirationDate: formData.expirationDate,
                paymentMethod: formData.paymentMethod,
                paymentPeriodicity: formData.paymentPeriodicity,
                paymentTerm: formData.paymentTerm,
                netPremium: formData.Amount,
                additionalInformation: "test",
                isSelected: true,
            }],
        },
    };
    
    // If it's the final update, add the idOwner, and conversion data
    if (isFinalUpdate) {
        leadWrapper = {
          idOwner: '005D700000GSthDIAT',
          ...leadWrapper
        };
        leadWrapper.conversionData = {
            convertedStatus: formData.StageName,
            policyNumber: formData.policyNumber,
        };
    }

    return { leadWrappers: [leadWrapper] };
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [salesforceIds, setSalesforceIds] = useState<SalesforceIds | null>(null);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  const [creationResponse, setCreationResponse] = useState<any>(null);
  
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryData: Partial<FormData> = {};
    for (const [key, value] of searchParams.entries()) {
      if (Object.prototype.hasOwnProperty.call(initialFormData, key)) {
        (queryData as any)[key] = value;
      }
    }

    if (Object.keys(queryData).length > 0) {
      setFormData(prevData => ({ ...prevData, ...queryData }));
    }
  }, [searchParams]);

  const handleNextStep = (data: Partial<FormData>) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS + 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleInitialSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    
    const submissionData: FormData = { ...formData, ...data };
    const leadPayload = buildLeadPayload(submissionData, false); // Not the final update

    try {
        const response = await submitLead(leadPayload);
        setCreationResponse(response);

        if (!response?.success || !response?.leadId) {
            console.error("Salesforce Response does not contain Lead ID:", response);
            throw new Error('Lead ID not found in Salesforce response.');
        }
        
        const leadId = response.leadId;
        const newIds: SalesforceIds = { id: leadId, idFullOperation: formData.idFullOperation! };
        
        setSalesforceIds(newIds);
        
        const nextStepData = { ...submissionData, id: leadId }; // Carry over the lead ID
        setFormData(nextStepData);
        
        setDirection(1);
        setCurrentStep((prev) => prev + 1);

    } catch(error) {
        console.error('Error creating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error al Crear Lead',
          description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleFinalSubmit = async (data: Partial<FormData>) => {
      setIsSubmitting(true);

      const generatedPolicyNumber = calculateUniqueId('POL');

      const finalData: FormData = { 
        ...formData, 
        ...data,
        StageName: '02',
        policyNumber: generatedPolicyNumber,
      };
      
      const updatePayload = buildLeadPayload(finalData, true); // This IS the final update

      try {
          const response = await submitLead(updatePayload);
          
          setSubmissionResponse(response);
          setFormData(finalData); 
          handleNextStep(finalData); 

      } catch (error) {
          console.error('Error updating lead:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
          toast({
              variant: 'destructive',
              title: 'Error al Actualizar Lead',
              description: errorMessage,
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStartOver = () => {
    setDirection(1);
    setFormData({...initialFormData, idFullOperation: calculateUniqueId('IS')});
    setSalesforceIds(null);
    setSubmissionResponse(null);
    setCreationResponse(null);
    setCurrentStep(1);
    setIsSubmitting(false);
  };
  
  const formVariants = {
    hidden: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: { duration: 0.5, ease: 'easeInOut' },
    }),
  };

  const renderStep = () => {
    const buildPreviewPayloadForStep = (stepData: any, isFinal = false) => {
        const dataForPreview: FormData = {
            ...formData,
            ...stepData,
            StageName: isFinal ? '02' : null,
        };
        return buildLeadPayload(dataForPreview, isFinal);
    };
    
    const formProps = {
        initialData: formData,
        isSubmitting: isSubmitting,
    };

    switch (currentStep) {
      case 1:
        return <ContactPreferenceForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 2:
        return <PersonalDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 3:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 4:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} {...formProps} buildPreviewPayload={(data) => buildPreviewPayloadForStep(data, false)} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} {...formProps} salesforceIds={salesforceIds} buildPreviewPayload={(data) => buildPreviewPayloadForStep(data, true)} />;
      case 6:
        return <SubmissionConfirmation onStartOver={handleStartOver} creationResponse={creationResponse} updateResponse={submissionResponse} salesforceIds={salesforceIds || {id: formData.id!, idFullOperation: formData.idFullOperation!}} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-grow flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl bg-card p-8 rounded-lg shadow-md mt-4">
          <header className="flex flex-col items-center justify-center mb-8">
            <FormStepper 
              currentStep={Math.min(currentStep, TOTAL_STEPS)} 
              totalSteps={TOTAL_STEPS} 
            />
          </header>

          <main className="relative min-h-[700px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
    
