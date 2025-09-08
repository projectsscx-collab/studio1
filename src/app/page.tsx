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
import { upsertLead, getSalesforceToken } from '@/ai/flows/insert-lead-flow';
import type { LeadWrapperData } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

const initialFormData: LeadWrapperData = {
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
  agentType: '',
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
  const [formData, setFormData] = useState<LeadWrapperData>(initialFormData);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  
  // These will be set after the first successful submission
  const [idFullOperation, setIdFullOperation] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null); 

  const { toast } = useToast();

  const handleNextStep = (data: Partial<LeadWrapperData>) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    if (currentStep <= TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async (data: Partial<LeadWrapperData>) => {
    setIsSubmitting(true);
    
    // Merge current step data with existing form data
    let updatedData = { ...formData, ...data };

    // Logic from Step 4 (Contact Preference)
    if (data.agentType === 'APM') {
      updatedData = { ...updatedData, systemOrigin: '02', origin: '02', utmCampaign: 'ROPO_APMCampaign', leadSource: '02' };
    } else if (data.agentType === 'ADM') {
      updatedData = { ...updatedData, systemOrigin: '06', origin: '02', utmCampaign: 'ROPO_ADMCampaign', leadSource: '10' };
    }
    
    // Logic from Step 5 (Emission)
    if (data.convertedStatus === '02') {
        updatedData = { ...updatedData, idOwner: '005D700000GSRhDIAX' };
    }

    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      
      const payload: LeadWrapperData = {
        ...updatedData,
        // Add existing IDs if they exist
        id: leadId, 
        idFullOperation: idFullOperation,
      };
      
      const response = await upsertLead(payload, token);
      
      const leadResult = response?.[0] ?? {};
      const newIdFullOperation = leadResult.idFullOperation ?? findKey(response, 'idFullOperation') ?? idFullOperation;
      const newLeadId = leadResult.leadResultId ?? findKey(response, 'leadResultId') ?? leadId;
      const error = leadResult.resultErrors?.[0];

      if (error) {
        throw new Error(error.errorMessage ?? 'An unknown error occurred during the upsert operation.');
      }
      
      // Persist IDs for subsequent steps
      if (newIdFullOperation) setIdFullOperation(newIdFullOperation);
      if (newLeadId) setLeadId(newLeadId);
      
      setSubmissionResponse(response);
      handleNextStep(updatedData); // Move to the next screen

    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error en el Envío',
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
  
    // Helper function to find a key in a nested object/array structure
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
        return <QuoteForm onSubmit={handleSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 5:
        return <EmissionForm onSubmit={handleSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
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
