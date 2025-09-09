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
import { updateOpportunity } from '@/ai/flows/update-opportunity-flow';
import type { FormData, SalesforceIds } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { format } from 'date-fns';


const TOTAL_STEPS = 5;

const calculateFullOperationId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `IS${timestamp}${randomPart}`;
};


const initialFormData: FormData = {
  // --- Salesforce IDs ---
  id: null, // This will hold the Opportunity ID after lead creation
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
  
  street: 'N/A',
  postalCode: 'N/A',
  city: 'N/A',
  district: 'N/A',
  municipality: 'N/A',
  state: 'XX', // Default value
  country: 'PR', // Default value

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
  agentType: '', // Frontend only field for agent logic
  sourceEvent: '01',
  UTMCampaign: '',
  
  // --- Step 5: Emission ---
  policyNumber: '', 
  StageName: '06', // Hardcoded as per business logic
  CloseDate: '',
  Amount: 10,
};


const buildLeadPayload = (formData: FormData) => {
    const riskObject = {
        'Número de matrícula__c': formData.numero_de_matricula,
        'Marca__c': formData.marca,
        'Modelo__c': formData.modelo,
        'Año del vehículo__c': formData.ano_del_vehiculo,
        'Número de serie__c': formData.numero_de_serie,
    };
    
    // Base sourceData
    let sourceData = {
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
    let utmData = {};

    // Conditional logic based on agentType
    if (formData.agentType === 'APM') {
        sourceData.systemOrigin = '02';
        sourceData.origin = '02';
        sourceData.leadSource = '02';
        utmData = { campaign: 'ROPO_APMCampaign' };
    } else if (formData.agentType === 'ADM') {
        sourceData.systemOrigin = '06';
        sourceData.origin = '02';
        sourceData.leadSource = '10';
        utmData = { campaign: 'ROPO_ADMCampaign' };
    }
    // If agentType is 'CC' or anything else, the defaults remain.


    const leadWrapper = {
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
                id: "123456", // Static ID as per example
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
          convertedStatus: null,
          policyNumber: ""
        }
    };
  
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
  
  const findKey = (obj: any, keyToFind: string): string | null => {
    if (obj === null || typeof obj !== 'object') return null;
    if (keyToFind in obj) return obj[keyToFind];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const found = findKey(obj[key], keyToFind);
        if (found) return found;
      }
    }
    return null;
  };

  const handleNextStep = (data: Partial<FormData>) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS + 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Step 1: Create the Lead in Salesforce
  const handleInitialSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const newIdFullOperation = calculateFullOperationId();
    
    const submissionData: FormData = { 
        ...formData, 
        ...data,
        idFullOperation: newIdFullOperation,
    };
    
    const leadPayload = buildLeadPayload(submissionData);

    try {
        const response = await submitLead(leadPayload);
        
        const error = findKey(response, 'errorMessage');
        if (error) throw new Error(error);

        // IMPORTANT: The leadResultId is actually the OPPORTUNITY ID
        const opportunityId = findKey(response, 'leadResultId');
        if (!opportunityId) throw new Error('Opportunity ID not found in Salesforce response.');
        
        const newIds: SalesforceIds = { id: opportunityId, idFullOperation: newIdFullOperation };
        
        setSalesforceIds(newIds);
        
        const nextStepData = { ...submissionData, ...newIds };
        
        handleNextStep(nextStepData);

    } catch(error) {
        console.error('Error creating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error al Crear el Lead',
          description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Step 2: Update the Opportunity
  const handleFinalSubmit = async (data: Partial<FormData>) => {
      if (!salesforceIds?.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Opportunity ID no encontrado. Por favor, reinicie el formulario.' });
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(true);

      const finalData: FormData = { 
        ...formData, 
        ...data, 
      };

      // This is the payload for the OPPORTUNITY UPDATE
      const opportunityPayload = {
          StageName: finalData.StageName || "06", // Ganada emitida
          CloseDate: format(new Date(), 'yyyy-MM-dd'), // Emission date
          Amount: finalData.Amount || 10,
          PolicyNumber__c: finalData.policyNumber || salesforceIds.id, // Use form data or default
      };

      try {
          const response = await updateOpportunity({
              opportunityId: salesforceIds.id,
              payload: opportunityPayload,
          });
          
          setSubmissionResponse({ success: true, ...response });
          setFormData(finalData); // Save final state
          handleNextStep(finalData); // Move to confirmation screen with all data

      } catch (error) {
          console.error('Error updating opportunity:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
          toast({
              variant: 'destructive',
              title: 'Error al Actualizar Oportunidad',
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
