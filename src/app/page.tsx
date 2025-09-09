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

const initialFormData: InsertLeadInput & UpdateLeadInput = {
  // Step 1 - Personal Details & Contact
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthdate: '',
  mobilePhone: '',
  phone: '',
  email: '',
  
  // Step 2 - Vehicle Details (inside risk object)
  numero_de_matricula: '',
  marca: '',
  modelo: '',
  ano_del_vehiculo: '',
  numero_de_serie: '',

  // Step 3 - Quote Details
  idFullOperation: '', 
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  
  // Step 4 - Contact Preference
  agentType: '',
  
  // Step 5 - Emission
  convertedStatus: '',
  policyNumber: '',

  // --- Static / Hardcoded data based on the provided JSON example ---
  // Address Data (Hardcoded for this prototype)
  street: '123 Main St', 
  postalCode: '12345', 
  city: 'Puerto Rico',
  district: 'Test', 
  municipality: 'Test',
  state: 'XX', 
  country: 'PR',
  colony: 'Central Park',

  // Interest Product (Hardcoded parts)
  businessLine: "01",
  sector: "XX_01",
  subsector: "XX_00",
  branch: "XX_205",

  // UTM Data (using new default)
  utmCampaign: "ROPO_Auto",
  
  // Source Data (using new defaults)
  sourceEvent: "01", 
  eventReason: "01",
  sourceSite: "Website",
  deviceType: "01",
  deviceModel: "iPhone",
  leadSource: "01",
  origin: "01",
  systemOrigin: "05",
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InsertLeadInput & UpdateLeadInput>(initialFormData);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  
  const [leadId, setLeadId] = useState<string | null>(null); 

  const { toast } = useToast();
  
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
  
  const handleInitialSubmit = async (data: Partial<InsertLeadInput>) => {
    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      const response = await insertLead(updatedData, token);

      const leadResult = response?.[0] ?? {};
      // Prioritize leadResultId and idFullOperation from the first successful result
      const successfulResult = response?.find((r: any) => r.leadResultId);
      const newLeadId = successfulResult?.leadResultId ?? findKey(response, 'leadResultId');
      const newFullOpId = successfulResult?.idFullOperation ?? findKey(response, 'idFullOperation');
      const error = findKey(response, 'errorMessage');

      if (error) {
        throw new Error(error);
      }
      
      if (!newLeadId) {
        throw new Error("Could not retrieve leadId from Salesforce after creation.");
      }

      setLeadId(newLeadId);
      setFormData(prev => ({ 
        ...prev, 
        idFullOperation: newFullOpId ?? prev.idFullOperation 
      }));
      
      setSubmissionResponse(response);
      handleNextStep(updatedData); 

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

  const handleUpdate = async (data: Partial<UpdateLeadInput>) => {
    setIsSubmitting(true);
    let updatedData = { ...formData, ...data };
    
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
        };
        const response = await updateLead(payload, token);

        const error = findKey(response, 'errorMessage');
        if (error) {
            throw new Error(error);
        }

        setSubmissionResponse(response);
        handleNextStep(updatedData); 
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
  
  const handleFinalSubmit = async (data: Partial<UpdateLeadInput>) => {
    setIsSubmitting(true);
    
    const finalData: UpdateLeadInput = { 
        ...formData, 
        ...data,
        id: leadId!,
        policyNumber: 'PENDIENTE', // Send a placeholder value to pass validation
    };
    setFormData(finalData);
    
    try {
        const token = await getSalesforceToken();
        const response = await updateLead(finalData, token);
        
        const error = findKey(response, 'errorMessage');
        if (error) {
            throw new Error(error);
        }
        setSubmissionResponse(response);
        handleNextStep(data);

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
