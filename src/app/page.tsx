
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

const calculateFullOperationId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randStr = Array.from({ length: 2 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `${Date.now()}${randStr}`;
};

const initialFormData: InsertLeadInput = {
  // Step 1 - Personal Details & Contact
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthdate: '',
  mobilePhone: '',
  phone: '',
  email: '',
  
  // Contact Address
  street: '123 Main St', 
  postalCode: '12345', 
  city: 'Puerto Rico',
  district: 'Test', 
  municipality: 'Test',
  state: 'XX', 
  country: 'PR',
  colony: 'Central Park',
  
  // Step 2 - Vehicle Details
  numero_de_matricula: '',
  marca: '',
  modelo: '',
  ano_del_vehiculo: '',
  numero_de_serie: '',

  // Step 3 - Quote Details
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  
  // Step 4 - Contact Preference
  agentType: '',
  sourceEvent: '01', // Default value
  
  // Step 5 - Emission
  convertedStatus: '',
  policyNumber: '', // Use empty string to avoid React null error

  // --- Static / Hardcoded data ---
  businessLine: "01",
  sector: "XX_01",
  subsector: "XX_00",
  branch: "XX_205",
  utmCampaign: "ROPO_Auto",
  eventReason: "01",
  sourceSite: "Website",
  deviceType: "01",
  deviceModel: "iPhone",
  leadSource: "01",
  origin: "01",
  systemOrigin: "05",
};

interface SalesforceIds {
    id: string;
    idFullOperation: string;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InsertLeadInput | UpdateLeadInput>(initialFormData);
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

  const handleNextStep = (data: Partial<InsertLeadInput>) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS + 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleInitialSubmit = async (data: Partial<InsertLeadInput>) => {
    setIsSubmitting(true);
    const newIdFullOperation = calculateFullOperationId();
    const finalData: InsertLeadInput = { 
        ...formData, 
        ...data,
        idFullOperation: newIdFullOperation,
    };
    
    try {
        const token = await getSalesforceToken();
        const response = await insertLead(finalData, token);
        
        const error = findKey(response, 'errorMessage');
        if (error) throw new Error(error);

        const leadId = findKey(response, 'leadResultId');
        if (!leadId) throw new Error('Lead ID not found in Salesforce response.');
        
        setSalesforceIds({ id: leadId, idFullOperation: newIdFullOperation });
        // Persist all data, including the new IDs, into the main form state
        setFormData(prev => ({...prev, ...data, id: leadId, idFullOperation: newIdFullOperation }));
        handleNextStep(data);

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

  const handleUpdate = async (data: Partial<InsertLeadInput>) => {
    if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado.' });
        return;
    }
    setIsSubmitting(true);
    
    const updatedData: UpdateLeadInput = { 
        ...formData, 
        ...data, 
        ...salesforceIds 
    };
    
    if (data.agentType === 'APM') {
      updatedData.systemOrigin = '02';
      updatedData.origin = '02';
      updatedData.utmCampaign = 'ROPO_APMCampaign';
      updatedData.leadSource = '02';
    } else if (data.agentType === 'ADM') {
      updatedData.systemOrigin = '06';
      updatedData.origin = '02';
      updatedData.utmCampaign = 'ROPO_ADMCampaign';
      updatedData.leadSource = '10';
    }
    
    try {
      const token = await getSalesforceToken();
      const response = await updateLead(updatedData, token);
      
      const error = findKey(response, 'errorMessage');
      if (error) throw new Error(error);
      
      setFormData(updatedData); // Persist updated data
      handleNextStep(data);

    } catch(error) {
        console.error('Error updating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error al Actualizar',
          description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleFinalSubmit = async (data: Partial<UpdateLeadInput>) => {
      if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado.' });
        return;
      }
      setIsSubmitting(true);
      
      const finalData: UpdateLeadInput = {
          ...formData,
          ...data,
          ...salesforceIds,
          convertedStatus: '02',
          policyNumber: salesforceIds.id, // Set policyNumber to the lead ID
      };

      try {
          const token = await getSalesforceToken();
          const response = await updateLead(finalData, token);
          
          const error = findKey(response, 'errorMessage');
          if (error) {
            throw new Error(error);
          }

          setSubmissionResponse(response);
          setFormData(finalData);
          handleNextStep(data);

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
    const combinedData = { ...formData, ...(salesforceIds || {}) };
    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} initialData={combinedData} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} initialData={combinedData} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} initialData={combinedData} isSubmitting={isSubmitting} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleUpdate} onBack={handlePrev} initialData={combinedData} isSubmitting={isSubmitting} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} initialData={combinedData} isSubmitting={isSubmitting} />;
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
