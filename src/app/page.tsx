
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

const calculateUniqueId = (prefix = 'ID') => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}${timestamp}${randomPart}`;
};


const initialFormData: FormData = {
  // --- Salesforce IDs ---
  id: null,
  idFullOperation: calculateUniqueId('IS'), // Generate ID at the beginning

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
  StageName: null, 
  CloseDate: null,
  Amount: 1000,
  isSelected: false,
};


const buildLeadPayload = (formData: FormData) => {
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

    if (formData.agentType === 'APM') {
        sourceData.systemOrigin = '02';
        sourceData.leadSource = '02';
        utmData = { UTMCampaign: 'ROPO_APMCampaign' };
    } else if (formData.agentType === 'ADM') {
        sourceData.leadSource = '10';
        utmData = { UTMCampaign: 'ROPO_ADMCampaign' };
    }
    
    // Base wrapper object for all calls
    const leadWrapper: any = {
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
    };
  
    const riskObject = {
        'Número de matrícula__c': formData.numero_de_matricula,
        'Marca__c': formData.marca,
        'Modelo__c': formData.modelo,
        'Año del vehículo__c': formData.ano_del_vehiculo,
        'Número de serie__c': formData.numero_de_serie,
    };

    // The interestProduct object is always present
    leadWrapper.interestProduct = {
        businessLine: "01",
        sector: "XX_01",
        subsector: "XX_00",
        branch: "XX_205",
        risk: JSON.stringify(riskObject),
    };
    
    // CRITICAL LOGIC: Add quotes and conversion data ONLY for the final update.
    if (formData.StageName === '06') { // Check for the final stage
        leadWrapper.id = formData.id; // Add Lead ID for the update
        
        leadWrapper.interestProduct.quotes = [{
            id: calculateUniqueId('QT'), // Generate a dynamic ID for the quote
            effectiveDate: formData.effectiveDate,
            expirationDate: formData.expirationDate,
            paymentMethod: formData.paymentMethod,
            paymentPeriodicity: formData.paymentPeriodicity,
            paymentTerm: formData.paymentTerm,
            netPremium: formData.Amount,
            additionalInformation: "test",
            isSelected: true // Only selected on the final update
        }];

        leadWrapper.conversionData = {
            convertedStatus: formData.StageName, 
            policyNumber: formData.policyNumber || null
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
    
    const submissionData: FormData = { 
        ...formData, 
        ...data,
        StageName: null, // CRITICAL: Ensure StageName is null for creation
    };
    
    // This payload is for creation. It should NOT contain quotes or conversionData.
    const leadPayload = buildLeadPayload(submissionData);

    try {
        const response = await submitLead(leadPayload);

        if (!response?.success || !response?.leadId) {
            console.error("Salesforce Response does not contain Lead ID:", response);
            throw new Error('Lead ID not found in Salesforce response.');
        }
        
        const leadId = response.leadId;
        // Keep the original idFullOperation, just add the returned Lead ID.
        const newIds: SalesforceIds = { id: leadId, idFullOperation: formData.idFullOperation };
        
        setSalesforceIds(newIds);
        
        const nextStepData = { ...submissionData, ...newIds };
        setFormData(nextStepData);
        
        setDirection(1);
        if (currentStep < TOTAL_STEPS + 1) {
            setCurrentStep((prev) => prev + 1);
        }

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

      // Set update-specific values
      const finalData: FormData = { 
        ...formData, 
        ...data,
        id: salesforceIds.id, 
        idFullOperation: salesforceIds.idFullOperation,
        StageName: '06', // Set to 'Won' for final conversion
        CloseDate: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
      };

      // This payload is complete, with all data for update and conversion.
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
    // Reset form but generate a new idFullOperation for the new session
    setFormData({...initialFormData, idFullOperation: calculateUniqueId('IS')});
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
    // This function for the preview now needs to know which stage it is
    const buildPreviewPayloadForStep = (currentData: any, isFinalStep = false) => {
        const dataForPreview: FormData = {
            ...formData,
            ...currentData,
            // Simulate the final stage for the emission form preview
            StageName: isFinalStep ? '06' : null,
            id: isFinalStep ? salesforceIds?.id || formData.id : null,
        };
        return buildLeadPayload(dataForPreview);
    };
    
    const formProps = {
        initialData: formData,
        isSubmitting: isSubmitting,
    };

    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} buildPreviewPayload={buildPreviewPayloadForStep} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} buildPreviewPayload={buildPreviewPayloadForStep} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} {...formProps} buildPreviewPayload={buildPreviewPayloadForStep} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} buildPreviewPayload={buildPreviewPayloadForStep} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} {...formProps} salesforceIds={salesforceIds} buildPreviewPayload={(data) => buildPreviewPayloadForStep(data, true)} />;
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
    

    
