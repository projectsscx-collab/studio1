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
import { insertLead, updateLead, getSalesforceToken } from '@/ai/flows/insert-lead-flow';
import type { InsertLeadInput, UpdateLeadInput } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

// This represents the full data structure across all steps
const initialFormData: InsertLeadInput & UpdateLeadInput = {
  // Step 1
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthdate: '',
  mobilePhone: '',
  phone: '',
  email: '',
  // Step 2
  numero_de_matricula: '',
  marca: '',
  modelo: '',
  ano_del_vehiculo: '',
  numero_de_serie: '',
  // Step 3
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  // Step 4
  sourceEvent: '01', // Default value
  agentType: '', // This is frontend-only logic
  systemOrigin: '05',
  origin: '01',
  utmCampaign: 'ROPO_Auto',
  leadSource: '01',
  // Step 5
  convertedStatus: '',
  policyNumber: '',
  idOwner: '',
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InsertLeadInput & UpdateLeadInput>(initialFormData);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  
  // These will be set after the first successful submission
  const [idFullOperation, setIdFullOperation] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null); 

  const { toast } = useToast();
  
  // Helper to find a key in a nested object/array structure
  const findKey = (obj: any, keyToFind: string): string | null => {
      if (obj === null || typeof obj !== 'object') {
          return null;
      }
      if (keyToFind in obj) {
          return obj[keyToFind];
      }
      for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
              const found = findKey(obj[key], keyToFind);
              if (found) {
                  return found;
              }
          }
      }
      return null;
  };

  const handleNextStep = (data: Partial<typeof formData>) => {
    setDirection(1);
    setFormData(prev => ({ ...prev, ...data }));
    if (currentStep <= TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  // Called by Step 3 to create the initial Lead
  const handleInitialSubmit = async (data: Partial<InsertLeadInput>) => {
    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      // Since we generate the ID in the form, we can persist it right away
      setIdFullOperation(updatedData.idFullOperation); 

      const response = await insertLead(updatedData, token);

      const leadResult = response?.[0] ?? {};
      const newLeadId = leadResult.leadResultId ?? findKey(response, 'leadResultId');
      const error = leadResult.resultErrors?.[0];

      if (error) {
        throw new Error(error.errorMessage ?? 'An unknown error occurred during lead creation.');
      }
      
      if (!newLeadId) {
        throw new Error("Could not retrieve required IDs from Salesforce after creation.");
      }

      // Persist the Salesforce record ID for subsequent steps
      setLeadId(newLeadId);
      
      setSubmissionResponse(response);
      handleNextStep(updatedData); // Move to step 4

    } catch (error) {
      console.error('Error creating lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error en la Creación del Lead',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called by Step 4 to update contact preferences
  const handleUpdate = async (data: Partial<UpdateLeadInput>) => {
    setIsSubmitting(true);
    let updatedData = { ...formData, ...data };
    
    // Logic from Step 4 (Contact Preference)
    if (data.agentType === 'APM') {
      updatedData = { ...updatedData, systemOrigin: '02', origin: '02', utmCampaign: 'ROPO_APMCampaign', leadSource: '02' };
    } else if (data.agentType === 'ADM') {
      updatedData = { ...updatedData, systemOrigin: '06', origin: '02', utmCampaign: 'ROPO_ADMCampaign', leadSource: '10' };
    }

    setFormData(updatedData);
    
    try {
        const token = await getSalesforceToken();
        const payload: UpdateLeadInput = {
            ...updatedData,
            id: leadId!,
            idFullOperation: idFullOperation!,
        };
        const response = await updateLead(payload, token);

        const error = findKey(response, 'errorMessage');
        if (error) {
            throw new Error(error);
        }

        setSubmissionResponse(response);
        handleNextStep(updatedData); // Move to Step 5
    } catch(error) {
        console.error('Error updating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error en la Actualización',
          description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Called by Step 5 to finalize and emit
  const handleFinalSubmit = async (data: Partial<UpdateLeadInput>) => {
    setIsSubmitting(true);
    let updatedData = { ...formData, ...data };
    
    // Logic from Step 5 (Emission)
    if (data.convertedStatus === '02') {
        updatedData = { ...updatedData, idOwner: '005D700000GSRhDIAX' };
    }
    
    setFormData(updatedData);
    
    try {
        const token = await getSalesforceToken();
        const payload: UpdateLeadInput = {
            ...updatedData,
            id: leadId!,
            idFullOperation: idFullOperation!,
        };
        const response = await updateLead(payload, token);

        // Per user request, ignore the "PolicyNumber" error and proceed,
        // as the operation is successful in Salesforce.
        const error = findKey(response, 'errorMessage');
        if (error && !error.includes('PolicyNumber')) {
            throw new Error(error);
        }

        setSubmissionResponse(response);
        handleNextStep(updatedData); // Move to final confirmation screen

    } catch(error) {
        console.error('Error finalizing lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error en la Emisión',
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
    setSubmissionResponse(null);
    setIdFullOperation(null);
    setLeadId(null);
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
    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} initialData={formData} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} initialData={formData} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleUpdate} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
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
