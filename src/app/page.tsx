
'use client';

import { useState } from 'react';
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
import { format, addYears } from 'date-fns';


const TOTAL_STEPS = 5;

const calculateFullOperationId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `IS${timestamp}${randomPart}`;
};


const initialFormData: FormData = {
  // --- Salesforce IDs ---
  id: null, // This will hold the Lead ID after creation
  idFullOperation: '',

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

  // --- Step 3: Quote Details ---
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  
  // --- Step 4: Contact Preference ---
  agentType: 'CC', // Default to Contact Center
  sourceEvent: '01',
  UTMCampaign: '',
  
  // --- Step 5: Emission ---
  policyNumber: '', 
  StageName: '06', 
  CloseDate: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
  Amount: 1000,
};


const buildLeadPayload = (formData: FormData) => {
    const riskObject = {
        'Número de matrícula__c': formData.numero_de_matricula,
        'Marca__c': formData.marca,
        'Modelo__c': formData.modelo,
        'Año del vehículo__c': formData.ano_del_vehiculo,
        'Número de serie__c': formData.numero_de_serie,
    };
    
    // Base sourceData, starting with CC defaults
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

    // Base utmData
    let utmData: any = {};

    // Conditional logic based on agentType
    if (formData.agentType === 'APM') {
        sourceData.systemOrigin = '02';
        sourceData.leadSource = '02';
        utmData = { UTMCampaign: 'ROPO_APMCampaign' };
    } else if (formData.agentType === 'ADM') {
        sourceData.leadSource = '10';
        utmData = { UTMCampaign: 'ROPO_ADMCampaign' };
    }
    
    const leadWrapper: any = {
        id: formData.id,
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
        interestProduct: {
            businessLine: "01",
            sector: "XX_01",
            subsector: "XX_00",
            branch: "XX_205",
            risk: JSON.stringify(riskObject),
            quotes: [{
                id: "123456",
                effectiveDate: formData.effectiveDate,
                expirationDate: formData.expirationDate,
                paymentMethod: formData.paymentMethod,
                isSelected: true,
                paymentPeriodicity: formData.paymentPeriodicity,
                paymentTerm: formData.paymentTerm,
                netPremium: formData.Amount,
                additionalInformation: "test"
            }]
        },
        utmData: utmData,
        sourceData: sourceData,
        conversionData: {
          convertedStatus: formData.id ? "06" : null,
          policyNumber: formData.policyNumber || null
        }
    };
  
    // Only include the 'id' field if it's not null.
    // This is crucial for distinguishing create vs. update calls.
    if (!formData.id) {
        delete leadWrapper.id;
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
  
  const { toast } = useToast();

  const handleNextStep = (data: Partial<FormData>) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS + 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleInitialSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const newIdFullOperation = calculateFullOperationId();
    
    // Create the submission data, ensuring ID is null for creation
    const submissionData: FormData = { 
        ...formData, 
        ...data,
        id: null,
        idFullOperation: newIdFullOperation,
    };
    
    const leadPayload = buildLeadPayload(submissionData);

    try {
        const response = await submitLead(leadPayload);

        if (!response?.success || !response?.leadId) {
            console.error("Salesforce Response does not contain Lead ID:", response);
            throw new Error('Lead ID not found in Salesforce response.');
        }
        
        const leadId = response.leadId;
        const newIds: SalesforceIds = { id: leadId, idFullOperation: newIdFullOperation };
        
        setSalesforceIds(newIds);
        
        const nextStepData = { ...submissionData, ...newIds };
        handleNextStep(nextStepData);

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
      if (!salesforceIds?.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado. Por favor, reinicie el formulario.' });
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(true);

      const finalData: FormData = { 
        ...formData, 
        ...data,
        id: salesforceIds.id, 
        idFullOperation: salesforceIds.idFullOperation,
      };

      const updatePayload = buildLeadPayload(finalData);

      try {
          const response = await submitLead(updatePayload);
          
          setSubmissionResponse({ success: true, ...response });
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
    setFormData(initialFormData);
    setSalesforceIds(null);
    setSubmissionResponse(null);
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
    const buildPreviewPayload = (data: any) => buildLeadPayload({ ...formData, ...data });
    
    const formProps = {
        initialData: formData,
        isSubmitting: isSubmitting,
        buildPreviewPayload: buildPreviewPayload
    };

    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} {...formProps} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} {...formProps} salesforceIds={salesforceIds} />;
      case 6:
        return <SubmissionConfirmation onStartOver={handleStartOver} response={submissionResponse} salesforceIds={salesforceIds} />;
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
    

    