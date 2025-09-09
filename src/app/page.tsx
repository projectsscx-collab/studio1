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
import { submitLead, getSalesforceToken } from '@/ai/flows/insert-lead-flow';
import type { FormData } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

const calculateFullOperationId = () => {
    // Combines timestamp with a random string to ensure uniqueness.
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${timestamp}IS${randomPart}`;
};


const initialFormData: FormData = {
  // --- Salesforce IDs ---
  id: null,
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
  
  // --- Step 5: Emission ---
  convertedStatus: '',
  policyNumber: '', // This will be set from salesforceIds.id
};

interface SalesforceIds {
    id: string;
    idFullOperation: string;
}

const buildLeadPayload = (formData: FormData, isFinalSubmission: boolean) => {
    const riskObject = {
        'numero_de_matricula': formData.numero_de_matricula,
        'marca': formData.marca,
        'modelo': formData.modelo,
        'ano_del_vehiculo': formData.ano_del_vehiculo,
        'numero_de_serie': formData.numero_de_serie,
    };

    let leadWrapper: any;

    if (isFinalSubmission) {
        // FINAL PAYLOAD STRUCTURE (for conversion)
        leadWrapper = {
            id: formData.id, // Crucial for update
            idFullOperation: formData.idFullOperation, // Crucial for upsert
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
                    street: "123 Main St",
                    postalCode: "12345",
                    city: "Puerto Rico",
                    district: "Test",
                    municipality: "Test",
                    state: "XX",
                    country: "PR",
                    colony: "Central Park"
                }
            },
            interestProduct: {
                businessLine: "01",
                sector: "XX_01",
                subsector: "XX_00",
                branch: "XX_205",
                risk: JSON.stringify(riskObject),
                quotes: [{
                    id: "TestWSConvertMIN",
                    effectiveDate: formData.effectiveDate,
                    expirationDate: formData.expirationDate,
                    paymentMethod: formData.paymentMethod,
                    paymentPeriodicity: formData.paymentPeriodicity,
                    paymentTerm: formData.paymentTerm,
                }]
            },
            utmData: {
                utmCampaign: formData.utmCampaign
            },
            sourceData: {
                sourceEvent: formData.sourceEvent,
                eventReason: "01",
                sourceSite: "Website",
                deviceType: "01",
                deviceModel: "iPhone",
                leadSource: formData.leadSource, 
                origin: formData.origin,
                systemOrigin: formData.systemOrigin,
            },
            conversionData: {
                convertedStatus: "02",
                policyNumber: formData.policyNumber
            }
        };
    } else {
        // INITIAL PAYLOAD STRUCTURE (for creation)
        leadWrapper = {
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
            },
            interestProduct: {
                businessLine: "01",
                sector: "XX_01",
                subsector: "XX_00",
                branch: "XX_205",
                risk: JSON.stringify(riskObject),
                quotes: [{
                    id: "TestWSConvertMIN",
                    effectiveDate: formData.effectiveDate,
                    expirationDate: formData.expirationDate,
                    productCode: "PRD001",
                    productName: "Life Insurance",
                    netPremium: 1000,
                    paymentMethod: formData.paymentMethod,
                    isSelected: true,
                    paymentPeriodicity: formData.paymentPeriodicity,
                    paymentTerm: formData.paymentTerm,
                    additionalInformation: "test"
                }]
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
            }
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

  const handleInitialSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const newIdFullOperation = calculateFullOperationId();
    
    // Create the full data object for submission, including the new ID
    const submissionData: FormData = { 
        ...formData, 
        ...data,
        idFullOperation: newIdFullOperation,
    };
    
    const leadPayload = buildLeadPayload(submissionData, false);

    try {
        const token = await getSalesforceToken();
        const response = await submitLead(leadPayload, token);
        
        const error = findKey(response, 'errorMessage');
        if (error) throw new Error(error);

        const leadId = findKey(response, 'leadResultId');
        if (!leadId) throw new Error('Lead ID not found in Salesforce response.');
        
        const newIds = { id: leadId, idFullOperation: newIdFullOperation };

        // ** CRITICAL FIX **
        // Update both the salesforceIds state AND the main formData state
        // This ensures the IDs persist through all subsequent steps.
        setSalesforceIds(newIds);
        const nextStepData = { ...data, ...newIds };
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
  
  const handleFinalSubmit = async (data: Partial<FormData>) => {
      if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado. Por favor, reinicie el formulario.' });
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(true);

      // ** CRITICAL FIX **
      // Explicitly merge formData, data from the current step, AND the stored salesforceIds
      // This ensures that id and idFullOperation are correctly passed to buildLeadPayload.
      const combinedData: FormData = { 
        ...formData, 
        ...data, 
        id: salesforceIds.id,
        idFullOperation: salesforceIds.idFullOperation
      };

      let finalData: FormData;
      
      // Agent-based logic
      if (combinedData.agentType === 'APM') {
        finalData = {
          ...combinedData,
          systemOrigin: '02',
          origin: '02',
          utmCampaign: 'ROPO_APMCampaign',
          leadSource: '02',
        };
      } else if (combinedData.agentType === 'ADM') {
        finalData = {
          ...combinedData,
          systemOrigin: '06',
          origin: '02',
          utmCampaign: 'ROPO_ADMCampaign',
          leadSource: '10',
        };
      } else { 
        finalData = {
          ...combinedData,
          systemOrigin: '05',
          origin: '01',
          utmCampaign: 'Winter2024',
          leadSource: '01',
        }
      }
      
      // Final conversion data
      finalData = {
          ...finalData,
          convertedStatus: '02',
          policyNumber: salesforceIds.id, // Use the stored Salesforce ID
      };

      const leadPayload = buildLeadPayload(finalData, true);

      try {
          const token = await getSalesforceToken();
          const response = await submitLead(leadPayload, token);
          
          const error = findKey(response, 'errorMessage');
          if (error) {
            throw new Error(error);
          }

          setSubmissionResponse(response);
          setFormData(finalData); // Save final state
          handleNextStep(data); // Move to confirmation screen

      } catch (error) {
          console.error('Error finalizing lead:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
          toast({
              variant: 'destructive',
              title: 'Error al Finalizar',
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
    const isFinalFlow = currentStep >= 5;
    
    const formProps = {
        initialData: formData,
        isSubmitting: isSubmitting,
        buildPreviewPayload: (data: any) => buildLeadPayload({ ...formData, ...data }, isFinalFlow)
    };

    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} {...formProps} />;
      case 4:
        // Now just moves to the next step without a backend call
        return <ContactPreferenceForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} {...formProps} />;
      case 6:
        return <SubmissionConfirmation onStartOver={handleStartOver} response={submissionResponse} />;
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
